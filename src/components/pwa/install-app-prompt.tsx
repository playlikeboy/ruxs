/* eslint-disable @next/next/no-img-element */
"use client";

import { RuxsMark } from "@/components/marketing/ruxs-mark";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Download, Share2, PlusSquare, CheckCircle, X, Smartphone } from "lucide-react";

const PWA_STORY_PREVIEWS = [
  { src: "/brand/ruxs-pwa-wide.png", label: "Daily essentials", width: 1024, height: 576 },
  { src: "/brand/ruxs-pwa-order-narrow.png", label: "Subscriptions", width: 682, height: 1024 },
  { src: "/brand/ruxs-pwa-delivery-narrow.png", label: "Morning delivery", width: 682, height: 1024 },
  { src: "/brand/ruxs-pwa-tiffin-narrow.png", label: "Tiffins", width: 682, height: 1024 },
  { src: "/brand/ruxs-pwa-kids-act-narrow.png", label: "Kids Zone", width: 682, height: 1024 },
  { src: "/brand/ruxs-pwa-kids-meals-narrow.png", label: "Kids meals", width: 682, height: 1024 },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type WindowWithInstallPrompt = Window & {
  __ruxsDeferredInstallPrompt?: BeforeInstallPromptEvent;
};

function subscribe() {
  return () => {};
}

function getIsClient() {
  return true;
}

function getIsStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - iOS Safari specific property
    window.navigator.standalone === true
  );
}

function getIsIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isAppleDevice = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|chrome/.test(ua);
  return isAppleDevice && isSafari;
}

function getIsDismissed() {
  if (typeof window === "undefined") return false;
  try {
    const dismissedTime = localStorage.getItem("ruxs_pwa_dismissed");
    return Boolean(dismissedTime && Date.now() - Number(dismissedTime) < 7 * 24 * 60 * 60 * 1000);
  } catch {
    return false;
  }
}

export function InstallAppPrompt({
  variant = "banner",
  className = "",
}: {
  variant?: "banner" | "card" | "button";
  className?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedOverride, setDismissedOverride] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const isMounted = useSyncExternalStore(subscribe, getIsClient, () => false);
  const isStandalone = useSyncExternalStore(subscribe, getIsStandalone, () => false);
  const isIOS = useSyncExternalStore(subscribe, getIsIOS, () => false);
  const initialDismissed = useSyncExternalStore(subscribe, getIsDismissed, () => false);
  const isDismissed = dismissedOverride || initialDismissed;
  const guideTitleId = useId();
  const guideCloseRef = useRef<HTMLButtonElement>(null);

  // The banner's install guide is a modal: focus its close button and let Escape close it.
  useEffect(() => {
    if (!showIOSGuide || variant === "card") return;
    guideCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowIOSGuide(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showIOSGuide, variant]);

  useEffect(() => {
    const getStoredPrompt = () =>
      (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt ?? null;

    const syncStoredPrompt = () => {
      const promptEvent = getStoredPrompt();
      if (promptEvent) setDeferredPrompt(promptEvent);
    };

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      delete (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt;
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("ruxs:install-prompt-available", syncStoredPrompt);
    window.addEventListener("ruxs:app-installed", handleAppInstalled);
    syncStoredPrompt();

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("ruxs:install-prompt-available", syncStoredPrompt);
      window.removeEventListener("ruxs:app-installed", handleAppInstalled);
    };
  }, []);

  if (!isMounted) return null;
  if (isStandalone && variant === "banner") return null;
  if (isDismissed && variant === "banner") return null;

  const handleInstallClick = async () => {
    const promptEvent =
      deferredPrompt ??
      (typeof window !== "undefined"
        ? (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt ?? null
        : null);

    if (promptEvent) {
      navigator.vibrate?.([15]);
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setDeferredPrompt(null);
        delete (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt;
      } catch (error) {
        console.warn("RUXs native install prompt failed:", error);
        setDeferredPrompt(null);
        delete (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt;
        setShowIOSGuide(true);
      }
    } else if (isIOS) {
      navigator.vibrate?.([15]);
      setShowIOSGuide(true);
    } else {
      // General guidance for browsers without prompt
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissedOverride(true);
    try {
      localStorage.setItem("ruxs_pwa_dismissed", String(Date.now()));
    } catch {
      /* stays dismissed for this visit only */
    }
  };

  if (isStandalone && variant === "card") {
    return (
      <div className={"flex items-center gap-3.5 rounded-card border border-line bg-brand-leaf p-4 " + className}>
        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-good/15 text-good" aria-hidden="true">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">App installed</p>
          <p className="text-xs text-muted">You&apos;re using RUXs from your home screen.</p>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={"rounded-card border border-line bg-surface p-4 " + className}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <RuxsMark className="h-11 w-11 shrink-0" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-semibold text-ink">Install the RUXs app</h3>
              </div>
              <p className="text-xs text-muted">Open RUXs straight from your home screen.</p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 -mx-1 flex gap-2.5 overflow-x-auto pb-1 px-1 scrollbar-none snap-x">
          {PWA_STORY_PREVIEWS.map((p) => (
            <figure
              key={p.src}
              className="relative shrink-0 snap-start overflow-hidden rounded-control border border-line bg-surface"
            >
              <img
                src={p.src}
                alt=""
                width={p.width}
                height={p.height}
                className="h-28 w-auto object-cover"
                loading="lazy"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-4">
                <span className="block max-w-[120px] truncate text-xs font-medium text-white">
                  {p.label}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            aria-expanded={deferredPrompt ? undefined : showIOSGuide}
            className="flex-1 flex min-h-11 items-center justify-center gap-2 rounded-control bg-ink text-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Install on this device
          </button>
        </div>

        {showIOSGuide && (
          <div className="mt-3.5 rounded-control border border-line bg-bg p-3.5 text-sm text-muted">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {isIOS ? "How to install on iPhone & iPad" : "How to install in Chrome / Android"}
              </span>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close install steps"
                className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-app-canvas hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {isIOS ? (
              <ol className="mt-2.5 space-y-2 list-decimal list-inside text-muted">
                <li>
                  Tap the <strong className="text-ink">Share icon</strong> (<Share2 className="inline h-3 w-3 mx-0.5 text-accent" aria-hidden="true" />) in Safari&apos;s bottom toolbar.
                </li>
                <li>
                  Scroll down and tap <strong className="text-ink">Add to Home Screen</strong> (<PlusSquare className="inline h-3 w-3 mx-0.5 text-ink" aria-hidden="true" />).
                </li>
                <li>
                  Tap <strong className="text-ink">Add</strong> in the top-right corner.
                </li>
              </ol>
            ) : (
              <ol className="mt-2.5 space-y-2 list-decimal list-inside text-muted">
                <li>
                  Tap the <strong className="text-ink">menu button (⋮)</strong> in Chrome&apos;s top-right corner.
                </li>
                <li>
                  Select <strong className="text-ink">Install app</strong> or <strong className="text-ink">Add to Home screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-ink">Install</strong> to add RUXs to your home screen.
                </li>
              </ol>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default: Banner style
  return (
    <>
      <div className={"relative overflow-hidden rounded-card border border-accent/20 bg-brand-peach p-3.5 " + className}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <RuxsMark className="h-9 w-9 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink leading-tight truncate">Install the RUXs app</p>
              <p className="text-xs text-muted leading-tight">Open RUXs straight from your home screen.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex min-h-10 items-center gap-1.5 rounded-control bg-ink px-3 text-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-white/60 hover:text-ink transition"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSGuide(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby={guideTitleId} className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent/10 text-accent" aria-hidden="true">
                  <Smartphone className="h-4 w-4" />
                </span>
                <h2 id={guideTitleId} className="text-base font-semibold text-ink">Add RUXs to your home screen</h2>
              </div>
              <button
                ref={guideCloseRef}
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close install steps"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-app-canvas hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted">
              RUXs opens full screen, like an app, with nothing to download from a store.
            </p>

            <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none snap-x">
              {PWA_STORY_PREVIEWS.map((p) => (
                <div
                  key={p.src}
                  className="shrink-0 snap-start overflow-hidden rounded-control border border-line bg-app-canvas"
                >
                  <img
                    src={p.src}
                    alt={p.label}
                    width={p.width}
                    height={p.height}
                    className="h-20 w-auto object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {isIOS ? (
              <ol className="mt-3.5 space-y-2.5 rounded-card bg-app-canvas p-3.5 text-sm text-ink">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">1</span>
                  <span>Tap the <strong className="text-ink">Share icon</strong> (<Share2 className="inline h-3.5 w-3.5 text-accent mx-0.5" aria-hidden="true" />) in Safari toolbar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">2</span>
                  <span>Scroll down and select <strong className="text-ink">Add to Home Screen</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-ink mx-0.5" aria-hidden="true" />)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">3</span>
                  <span>Tap <strong className="text-ink">Add</strong> in top right corner</span>
                </li>
              </ol>
            ) : (
              <ol className="mt-3.5 space-y-2.5 rounded-card bg-app-canvas p-3.5 text-sm text-ink">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">1</span>
                  <span>Tap the <strong className="text-ink">menu button (⋮)</strong> in Chrome&apos;s top-right corner</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">2</span>
                  <span>Select <strong className="text-ink">Install app</strong> (or <strong className="text-ink">Add to Home screen</strong>)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">3</span>
                  <span>Tap <strong className="text-ink">Install</strong> to complete</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 flex min-h-11 w-full items-center justify-center rounded-control bg-ink text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
