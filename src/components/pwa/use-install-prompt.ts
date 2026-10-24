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
    const onInstalled = () => setInstalledNow(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    if (outcome === "accepted") setInstalledNow(true);
    return outcome === "accepted";
  }, [event]);

  const state: InstallState = standalone || installedNow ? "installed" : event ? "ready" : ios ? "ios" : "unavailable";
  return { state, install };
}
