"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share2, PlusSquare, CheckCircle, X, Sparkles, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

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

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isMounted) return null;
  if (isStandalone && variant === "banner") return null;
  if (isDismissed && variant === "banner") return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      navigator.vibrate?.([15]);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
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
    } catch {}
  };

  if (isStandalone && variant === "card") {
    return (
      <div className={"flex items-center gap-3.5 rounded-2xl border border-black/5 bg-mint/30 p-4 " + className}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-good/15 text-good">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">App Installed</p>
          <p className="text-xs text-neutral-500">You are using the official RUXs native PWA experience.</p>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={"rounded-2xl border border-black/10 bg-gradient-to-br from-peach/30 via-white to-butter/20 p-4.5 shadow-2xs " + className}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-bold text-ink">Install RUXs App</h3>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">FAST</span>
              </div>
              <p className="text-xs text-neutral-500">Instant home screen access, offline speed &amp; notifications</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Install on this device
          </button>
        </div>

        {showIOSGuide && (
          <div className="mt-3.5 rounded-xl border border-black/10 bg-white p-3.5 text-xs text-neutral-600 shadow-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-accent" />
                {isIOS ? "How to install on iPhone & iPad" : "How to install in Chrome / Android"}
              </span>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-neutral-400 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isIOS ? (
              <ol className="mt-2.5 space-y-2 list-decimal list-inside text-neutral-600">
                <li>
                  Tap the <strong className="text-ink">Share icon</strong> (<Share2 className="inline h-3 w-3 mx-0.5 text-accent" />) in Safari&apos;s bottom toolbar.
                </li>
                <li>
                  Scroll down and tap <strong className="text-ink">Add to Home Screen</strong> (<PlusSquare className="inline h-3 w-3 mx-0.5 text-ink" />).
                </li>
                <li>
                  Tap <strong className="text-ink">Add</strong> in the top-right corner.
                </li>
              </ol>
            ) : (
              <ol className="mt-2.5 space-y-2 list-decimal list-inside text-neutral-600">
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
      <div className={"relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-peach/50 via-white to-butter/40 p-3.5 shadow-sm " + className}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink leading-tight truncate">Install RUXs App</p>
              <p className="text-[11px] text-neutral-600 leading-tight">Fast 1-tap ordering right from your home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white shadow-2xs transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-black/5 hover:text-ink transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Smartphone className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-ink">Install on Home Screen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-neutral-600">
              Install RUXs for a full-screen, native experience with zero download required.
            </p>

            {isIOS ? (
              <ol className="mt-3.5 space-y-2.5 rounded-2xl bg-neutral-50 p-3.5 text-xs text-neutral-700">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">1</span>
                  <span>Tap the <strong className="text-ink">Share icon</strong> (<Share2 className="inline h-3.5 w-3.5 text-accent mx-0.5" />) in Safari toolbar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">2</span>
                  <span>Scroll down and select <strong className="text-ink">Add to Home Screen</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-ink mx-0.5" />)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">3</span>
                  <span>Tap <strong className="text-ink">Add</strong> in top right corner</span>
                </li>
              </ol>
            ) : (
              <ol className="mt-3.5 space-y-2.5 rounded-2xl bg-neutral-50 p-3.5 text-xs text-neutral-700">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">1</span>
                  <span>Tap the <strong className="text-ink">menu button (⋮)</strong> in Chrome&apos;s top-right corner</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">2</span>
                  <span>Select <strong className="text-ink">Install app</strong> (or <strong className="text-ink">Add to Home screen</strong>)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">3</span>
                  <span>Tap <strong className="text-ink">Install</strong> to complete</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-ink text-xs font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
