"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LocateFixed, MapPin } from "lucide-react";
import { saveLocation } from "@/features/consumer/actions";

export function LocationChip({ label, hasPoint }: { label: string | null; hasPoint: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function locate() {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(async () => {
          const res = await saveLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          if (res.needsAddress) {
            const qs = new URLSearchParams({
              area: res.area,
              city: res.city,
              lat: String(pos.coords.latitude),
              lng: String(pos.coords.longitude),
            });
            router.push("/app/account?" + qs.toString());
          } else {
            toast.success("Showing stores near you");
            router.refresh();
          }
        });
      },
      () => toast.error("Allow location access to find stores near you"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/app/account" className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Deliver to</span>
        <span className="flex items-center gap-1 truncate text-[15px] font-semibold text-ink">
          <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate">{label ?? "Set your address"}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={locate}
        disabled={pending}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 text-[13px] font-semibold text-ink shadow-sm transition active:scale-95 disabled:opacity-60"
      >
        <LocateFixed className={"h-4 w-4 " + (pending ? "animate-spin" : "")} aria-hidden="true" />
        {hasPoint ? "Update" : "Locate me"}
      </button>
    </div>
  );
}
