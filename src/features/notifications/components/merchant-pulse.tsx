"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMerchantPulse, type MerchantPulse as Pulse } from "@/features/notifications/pulse";

const POLL_MS = 30_000;

type Nav = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

/**
 * Keeps an open merchant panel live: checks for new orders and booking requests,
 * shows a toast, refreshes the page data and sets the app icon badge.
 */
export function MerchantPulse({ slug, initial }: { slug: string; initial: Pulse }) {
  const router = useRouter();
  const last = useRef(initial);

  useEffect(() => {
    let stopped = false;

    const badge = (p: Pulse) => {
      const nav = navigator as Nav;
      const total = p.orders + p.requests;
      if (total > 0) void nav.setAppBadge?.(total).catch(() => {});
      else void nav.clearAppBadge?.().catch(() => {});
    };

    const check = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const now = await getMerchantPulse({ slug });
        const before = last.current;
        last.current = now;
        badge(now);
        if (now.orders > before.orders) {
          const n = now.orders - before.orders;
          toast.success(n === 1 ? "New order" : `${n} new orders`, {
            action: { label: "Open", onClick: () => router.push(`/merchant-panel/${slug}/orders`) },
          });
        }
        if (now.requests > before.requests) {
          const n = now.requests - before.requests;
          toast.success(n === 1 ? "New booking request" : `${n} new booking requests`, {
            action: { label: "Review", onClick: () => router.push(`/merchant-panel/${slug}/bookings?view=list&tab=upcoming`) },
          });
        }
        if (now.orders !== before.orders || now.requests !== before.requests) router.refresh();
      } catch {
        /* offline or signed out: try again next tick */
      }
    };

    badge(initial);
    const id = window.setInterval(check, POLL_MS);
    const onVisible = () => void check();
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "ruxs-push") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [slug, initial, router]);

  return null;
}
