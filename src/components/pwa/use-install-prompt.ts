"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "ready" | "ios" | "unavailable";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const noSubscribe = () => () => {};

type WindowWithInstallPrompt = Window & { __ruxsDeferredInstallPrompt?: BeforeInstallPromptEvent };

/** The root layout stashes the prompt event before this hook mounts (see service-worker-register). */
function storedPrompt() {
  return (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt ?? null;
}

/** Tracks whether this page can be installed and offers the native prompt when it can. */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedNow, setInstalledNow] = useState(false);
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => false);
  const ios = useSyncExternalStore(noSubscribe, isIOS, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onStored = () => {
      const stored = storedPrompt();
      if (stored) setEvent(stored);
    };
    const onInstalled = () => setInstalledNow(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("ruxs:install-prompt-available", onStored);
    window.addEventListener("appinstalled", onInstalled);
    queueMicrotask(onStored);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("ruxs:install-prompt-available", onStored);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    delete (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt;
    if (outcome === "accepted") setInstalledNow(true);
    return outcome === "accepted";
  }, [event]);

  const state: InstallState = standalone || installedNow ? "installed" : event ? "ready" : ios ? "ios" : "unavailable";
  return { state, install };
}
