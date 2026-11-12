"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { removePushSubscription, savePushSubscription } from "@/features/notifications/actions";

export type PushState = "unsupported" | "blocked" | "off" | "on" | "working";

function keyBytes(base64url: string) {
  const b64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((base64url.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(() => navigator.serviceWorker.ready);
}

const noSubscribe = () => () => {};

function supportOf(vapidPublicKey: string | null): "unsupported" | "blocked" | "ok" {
  if (!vapidPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return Notification.permission === "denied" ? "blocked" : "ok";
}

/** Turns push alerts on or off for this device and keeps the server in sync. */
export function usePushAlerts(vapidPublicKey: string | null) {
  const [live, setLive] = useState<PushState>("working");
  const support = useSyncExternalStore(noSubscribe, () => supportOf(vapidPublicKey), () => "ok" as const);

  useEffect(() => {
    if (support !== "ok") return;
    registration()
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setLive(sub ? "on" : "off"))
      .catch(() => setLive("unsupported"));
  }, [support]);

  const state: PushState = support === "ok" ? live : support;

  const enable = useCallback(async () => {
    if (!vapidPublicKey) return "Alerts are not set up yet.";
    setLive("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setLive(permission === "denied" ? "blocked" : "off");
        return "Allow notifications to get order alerts.";
      }
      const reg = await registration();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidPublicKey) }));
      const res = await savePushSubscription(sub.toJSON());
      setLive(res.ok ? "on" : "off");
      return res.ok ? null : res.error;
    } catch {
      setLive("off");
      return "This browser couldn't turn on alerts.";
    }
  }, [vapidPublicKey]);

  /** Returns an error message, or null when alerts are off for this device. */
  const disable = useCallback(async () => {
    setLive("working");
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setLive("off");
      return null;
    } catch {
      setLive("on");
      return "Couldn't turn off alerts. Please try again.";
    }
  }, []);

  return { state, enable, disable };
}
