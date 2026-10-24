"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveStorefront } from "@/features/vendors/actions";
import { GST_RATES_BPS, percentLabel } from "@/core/pricing";
import { LocationPicker } from "@/features/platform/components/location-picker";

const input = "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const label = "mb-1 block text-xs font-medium text-ink";

export interface StorefrontValues {
  name: string;
  phone: string;
  upiVpa: string;
  area: string;
  city: string;
  mapsUrl: string;
  description: string;
  coverUrl: string;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  deliveryFeePaise: number;
  minOrderPaise: number;
  acceptingOrders: boolean;
  gstBps: number;
  pricesIncludeGst: boolean;
  discountBps: number;
}

/** The vendor's own business details: who they are, where they are, how far they go, and what it costs. */
export function StorefrontForm({ slug, initial, provider = false }: { slug: string; initial: StorefrontValues; provider?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    name: initial.name,
    phone: initial.phone,
    upiVpa: initial.upiVpa,
    area: initial.area,
    city: initial.city,
    description: initial.description,
    coverUrl: initial.coverUrl,
    radius: String(initial.serviceRadiusKm),
    fee: String(initial.deliveryFeePaise / 100),
    minOrder: String(initial.minOrderPaise / 100),
    accepting: initial.acceptingOrders,
    gstBps: String(initial.gstBps),
    gstIncluded: initial.pricesIncludeGst,
    discount: String(initial.discountBps / 100),
  });
  const [loc, setLoc] = useState({ latitude: initial.latitude?.toString() ?? "", longitude: initial.longitude?.toString() ?? "", mapsUrl: initial.mapsUrl });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const latitude = loc.latitude.trim() === "" ? null : Number(loc.latitude);
        const longitude = loc.longitude.trim() === "" ? null : Number(loc.longitude);
        if ((latitude === null) !== (longitude === null)) return toast.error("Set both latitude and longitude, or neither");
        startTransition(async () => {
          const res = await saveStorefront({
            slug,
            name: f.name,
            phone: f.phone,
            upiVpa: f.upiVpa,
            area: f.area,
            city: f.city,
            mapsUrl: loc.mapsUrl,
            description: f.description,
            coverUrl: f.coverUrl,
            latitude,
            longitude,
            serviceRadiusKm: Math.round(Number(f.radius)),
            deliveryFeeRupees: Number(f.fee || 0),
            minOrderRupees: Number(f.minOrder || 0),
            acceptingOrders: f.accepting,
            gstBps: Number(f.gstBps),
            pricesIncludeGst: f.gstIncluded,
            discountPercent: Number(f.discount || 0),
          });
          if (!res.ok) toast.error(res.error ?? "Could not save");
          else {
            toast.success("Business details saved");
            router.refresh();
          }
        });
      }}
    >
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-line p-3">
        <span>
          <span className="block text-sm font-semibold text-ink">{provider ? "Taking bookings" : "Taking one-time orders"}</span>
          <span className="block text-xs text-muted">{provider ? "Pause when you're away. Existing sessions stay." : "Pause when the kitchen is closed. Plans keep running."}</span>
        </span>
        <input type="checkbox" className="peer sr-only" checked={f.accepting} onChange={(e) => setF({ ...f, accepting: e.target.checked })} />
        <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-good after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" aria-hidden="true" />
      </label>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Business</legend>
        <label className={label}>Business name<input required value={f.name} onChange={set("name")} className={input + " mt-1"} /></label>
        <label className={label}>Phone (+91…)<input required value={f.phone} onChange={set("phone")} className={input + " mt-1 font-mono"} /></label>
        <label className={label + " sm:col-span-2"}>
          Payout UPI ID
          <input required value={f.upiVpa} onChange={set("upiVpa")} placeholder="name@upi" className={input + " mt-1 font-mono"} />
          <span className="mt-1 block text-[11px] font-normal text-muted">RUXs sends your monthly withdrawals here. Households never see your phone.</span>
        </label>
        <label className={label + " sm:col-span-2"}>About{provider ? " you" : " your store"}<textarea rows={3} maxLength={400} value={f.description} onChange={set("description")} className={input + " mt-1"} /></label>
        <label className={label + " sm:col-span-2"}>Cover photo link<input type="url" value={f.coverUrl} onChange={set("coverUrl")} placeholder="https://…" className={input + " mt-1"} /></label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{provider ? "Gym / clinic location" : "Kitchen / shop location"}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Area<input required value={f.area} onChange={set("area")} className={input + " mt-1"} /></label>
          <label className={label}>City<input required value={f.city} onChange={set("city")} className={input + " mt-1"} /></label>
        </div>
        <LocationPicker value={loc} onChange={setLoc} />
      </fieldset>

      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{provider ? "Home visits" : "Delivery"}</legend>
        <label className={label}>Radius (km)<input inputMode="numeric" value={f.radius} onChange={set("radius")} className={input + " mt-1 tabular-nums"} /></label>
        <label className={label}>{provider ? "Visit fee ₹" : "Delivery ₹"}<input inputMode="decimal" value={f.fee} onChange={set("fee")} className={input + " mt-1 tabular-nums"} /></label>
        {!provider && <label className={label}>Min order ₹<input inputMode="decimal" value={f.minOrder} onChange={set("minOrder")} className={input + " mt-1 tabular-nums"} /></label>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Pricing on the bill</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className={label}>
            GST rate
            <select value={f.gstBps} onChange={(e) => setF({ ...f, gstBps: e.target.value })} className={input + " mt-1"}>
              {GST_RATES_BPS.map((r) => (
                <option key={r} value={r}>{r === 0 ? "No GST" : percentLabel(r)}</option>
              ))}
            </select>
          </label>
          <label className={label}>Store discount %<input inputMode="decimal" value={f.discount} onChange={set("discount")} className={input + " mt-1 tabular-nums"} /></label>
        </div>
        {f.gstBps !== "0" && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={f.gstIncluded} onChange={(e) => setF({ ...f, gstIncluded: e.target.checked })} className="h-4 w-4 accent-accent" />
            My prices already include GST
          </label>
        )}
        <p className="text-xs text-muted">Households see item total, discount, GST and delivery as separate lines before they pay.</p>
      </fieldset>

      <button type="submit" disabled={pending} className="h-11 w-full rounded-[12px] bg-accent text-sm font-bold text-white disabled:opacity-60 sm:w-auto sm:px-8">
        {pending ? "Saving…" : "Save business details"}
      </button>
    </form>
  );
}
