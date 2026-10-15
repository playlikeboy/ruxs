"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LocateFixed } from "lucide-react";
import { saveStorefront } from "@/features/vendors/actions";

const input = "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const label = "mb-1 block text-xs font-medium text-ink";

export interface StorefrontValues {
  description: string;
  coverUrl: string;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  deliveryFeePaise: number;
  minOrderPaise: number;
  acceptingOrders: boolean;
}

export function StorefrontForm({ slug, initial }: { slug: string; initial: StorefrontValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [description, setDescription] = useState(initial.description);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [lat, setLat] = useState(initial.latitude?.toString() ?? "");
  const [lng, setLng] = useState(initial.longitude?.toString() ?? "");
  const [radius, setRadius] = useState(String(initial.serviceRadiusKm));
  const [fee, setFee] = useState(String(initial.deliveryFeePaise / 100));
  const [minOrder, setMinOrder] = useState(String(initial.minOrderPaise / 100));
  const [accepting, setAccepting] = useState(initial.acceptingOrders);

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        toast.success("Location captured — save to apply");
      },
      () => toast.error("Allow location access, or type the coordinates")
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const latitude = lat.trim() === "" ? null : Number(lat);
        const longitude = lng.trim() === "" ? null : Number(lng);
        if ((latitude === null) !== (longitude === null)) {
          toast.error("Enter both latitude and longitude, or neither");
          return;
        }
        startTransition(async () => {
          const res = await saveStorefront({
            slug,
            description,
            coverUrl,
            latitude,
            longitude,
            serviceRadiusKm: Math.round(Number(radius)),
            deliveryFeeRupees: Number(fee || 0),
            minOrderRupees: Number(minOrder || 0),
            acceptingOrders: accepting,
          });
          if (!res.ok) toast.error(res.error ?? "Could not save");
          else {
            toast.success("Storefront updated");
            router.refresh();
          }
        });
      }}
    >
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-line p-3">
        <span>
          <span className="block text-sm font-semibold text-ink">Taking one-time orders</span>
          <span className="block text-xs text-muted">Pause when the kitchen is closed. Plans keep running.</span>
        </span>
        <input type="checkbox" className="peer sr-only" checked={accepting} onChange={(e) => setAccepting(e.target.checked)} />
        <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-good after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" aria-hidden="true" />
      </label>

      <div>
        <label htmlFor="sf-desc" className={label}>About your store</label>
        <textarea id="sf-desc" rows={3} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghar jaisa khana since 2015. Fresh rotis, no onion-garlic on request." className={input} />
      </div>
      <div>
        <label htmlFor="sf-cover" className={label}>Cover photo link</label>
        <input id="sf-cover" type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" className={input} />
      </div>

      <div className="space-y-2 rounded-[12px] bg-bg p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kitchen location</p>
          <button type="button" onClick={locate} className="flex items-center gap-1 text-xs font-semibold text-accent">
            <LocateFixed className="h-3.5 w-3.5" /> Use my location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className={input + " font-mono"} />
          <input aria-label="Longitude" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className={input + " font-mono"} />
        </div>
        <p className="text-[11px] text-muted">Without a pin we use your area&apos;s centre. Set it from the kitchen for accurate distances.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="sf-radius" className={label}>Radius (km)</label>
          <input id="sf-radius" inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} className={input + " tabular-nums"} />
        </div>
        <div>
          <label htmlFor="sf-fee" className={label}>Delivery ₹</label>
          <input id="sf-fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} className={input + " tabular-nums"} />
        </div>
        <div>
          <label htmlFor="sf-min" className={label}>Min order ₹</label>
          <input id="sf-min" inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className={input + " tabular-nums"} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="w-full rounded-[12px] bg-accent py-3 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save storefront"}
      </button>
    </form>
  );
}
