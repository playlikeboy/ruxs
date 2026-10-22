"use client";

import { useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LocateFixed, MapPin } from "lucide-react";
import { saveLocation } from "@/features/consumer/actions";

const ASKED_KEY = "ruxs-gps-asked";

export function LocationChip({
  label,
  source,
}: {
  label: string | null;
  source: "address" | "gps" | "approx" | "none";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const autoTried = useRef(false);

  function locate(auto: boolean, attempt = 0) {
    if (!("geolocation" in navigator)) {
      if (!auto) toast.error("Location isn't available on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(async () => {
          const res = await saveLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          if (!res.ok) {
            if (!auto) toast.error(res.error);
            return;
          }
          if (res.needsAddress && !auto) {
            const qs = new URLSearchParams({
              area: res.area,
              city: res.city,
              lat: String(pos.coords.latitude),
              lng: String(pos.coords.longitude),
            });
            router.push("/app/account?" + qs.toString());
            return;
          }
          if (!auto) toast.success("Showing stores near you");
          router.refresh();
        });
      },
      (err) => {
        // A cold GPS often reports "unavailable" or times out on the first try.
        if (err.code !== err.PERMISSION_DENIED && attempt < 2) {
          setTimeout(() => locate(auto, attempt + 1), 1500 * (attempt + 1));
          return;
        }
        if (!auto) toast.error("Allow location access to find stores near you");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }

  // First visit with no GPS fix: ask once, automatically. Later visits keep the saved point.
  useEffect(() => {
    if (autoTried.current || source === "address" || source === "gps") return;
    autoTried.current = true;
    let asked = false;
    try {
      asked = window.localStorage.getItem(ASKED_KEY) === "1";
      window.localStorage.setItem(ASKED_KEY, "1");
    } catch {
      // Storage blocked: still ask, just not remembered.
    }
    if (!asked) locate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/app/account" className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
          {source === "approx" ? "Approx. location" : "Deliver to"}
        </span>
        <span className="flex items-center gap-1 truncate text-[15px] font-semibold text-ink">
          <MapPin className="h-4 w-4 shrink-0 text-brand-coral" aria-hidden="true" />
          <span className="truncate">{label ?? "Set your location"}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => locate(false)}
        disabled={pending}
        className="flex h-12 min-h-12 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-brand-peach/55 px-3.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand-coral/30 active:scale-[0.98] disabled:opacity-60"
      >
        <LocateFixed className={"h-4 w-4 " + (pending ? "animate-spin" : "")} aria-hidden="true" />
        {source === "gps" || source === "address" ? "Update" : "Use exact location"}
      </button>
    </div>
  );
}
