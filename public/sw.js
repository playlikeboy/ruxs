// RUXs Progressive Web App Service Worker
const CACHE_NAME = 'ruxs-pwa-v2';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/brand/ruxs-app-icon-192.png',
  '/brand/ruxs-app-icon-512.png',
  '/brand/ruxs-app-icon-maskable-192.png',
  '/brand/ruxs-app-icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((err) => {
        // Precache error should not fail service worker installation
        console.warn('RUXs PWA precache partial failure', err);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Chrome Android installability requires a functional fetch event listener
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests with HTTP/HTTPS schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // Skip API calls, auth handlers, and merchant/admin mutating actions to prevent stale state
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/handler') ||
    url.pathname.startsWith('/merchant-panel') ||
    url.pathname.startsWith('/admin')
  ) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful responses for static assets and images
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/brand/') ||
            url.pathname.startsWith('/_next/static/') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.webp'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, fallback to cached root if offline
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/');
          if (fallback) {
            return fallback;
          }
        }

        return new Response('Offline — please check your internet connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// Push notifications: new orders, booking requests, reminders.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'RUXs', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'RUXs';
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || '',
        icon: '/brand/ruxs-app-icon-192.png',
        badge: '/brand/ruxs-app-icon-maskable-192.png',
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url: data.url || '/' },
      }),
      self.navigator && 'setAppBadge' in self.navigator ? self.navigator.setAppBadge().catch(() => {}) : null,
      // Tell open panels to refresh their counts.
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => list.forEach((c) => c.postMessage({ type: 'ruxs-push' }))),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      const sameApp = list.find((c) => new URL(c.url).pathname.startsWith(new URL(target).pathname.split('/').slice(0, 3).join('/')));
      if (sameApp && 'navigate' in sameApp) return sameApp.navigate(target).then((c) => c && c.focus());
      return self.clients.openWindow(target);
    })
  );
});
