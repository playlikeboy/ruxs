/**
 * Google Maps links → coordinates. Pure parsing only; short links
 * (maps.app.goo.gl) are expanded on the server first.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Hosts we accept as Google Maps links (also the allowlist for expanding short links). */
export const MAPS_HOSTS = ["google.com", "www.google.com", "maps.google.com", "google.co.in", "www.google.co.in", "maps.app.goo.gl", "goo.gl", "g.co"];

export function isMapsHost(host: string): boolean {
  return MAPS_HOSTS.includes(host.toLowerCase());
}

export function isShortMapsLink(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "maps.app.goo.gl" || (u.hostname === "goo.gl" && u.pathname.startsWith("/maps")) || u.hostname === "g.co";
  } catch {
    return false;
  }
}

function valid(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { latitude: Math.round(lat * 1e6) / 1e6, longitude: Math.round(lng * 1e6) / 1e6 };
}

/**
 * Reads coordinates from the common Google Maps URL shapes:
 * place pins (!3d…!4d…), map centre (@lat,lng,zoom), and query params
 * (q=, query=, ll=, destination=). Also accepts plain "lat, lng" text.
 */
export function parseMapsCoordinates(input: string): LatLng | null {
  const text = input.trim();
  const plain = text.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (plain) return valid(Number(plain[1]), Number(plain[2]));

  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    // keep raw text
  }
  // The exact place pin wins over the map's centre.
  const pin = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return valid(Number(pin[1]), Number(pin[2]));
  const at = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return valid(Number(at[1]), Number(at[2]));
  try {
    const u = new URL(text);
    for (const key of ["q", "query", "ll", "destination", "center"]) {
      const v = u.searchParams.get(key);
      const m = v?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (m) return valid(Number(m[1]), Number(m[2]));
    }
  } catch {
    // not a URL
  }
  return null;
}

/** A Google Maps link for directions to a point. */
export function directionsUrl(p: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
}
