"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
}

type WindowWithInstallPrompt = Window & {
  __ruxsDeferredInstallPrompt?: BeforeInstallPromptEvent;
};

// Capture this as soon as the root client bundle loads. Account pages can be
// server-rendered asynchronously, after Chromium has already emitted the event.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt =
      event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("ruxs:install-prompt-available"));
  });

  window.addEventListener("appinstalled", () => {
    delete (window as WindowWithInstallPrompt).__ruxsDeferredInstallPrompt;
    window.dispatchEvent(new Event("ruxs:app-installed"));
  });
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .catch((error) => {
            console.warn("PWA Service Worker registration skipped:", error);
          });
      };

      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad, { once: true });
      }
    }
  }, []);

  return null;
}
