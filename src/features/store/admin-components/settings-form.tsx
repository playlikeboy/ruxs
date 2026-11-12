"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { rupeesToPaise } from "@/core/money";
import { saveStoreSettings } from "../actions";
import type { StoreSettings } from "../types";
import { paiseToInput } from "./store-labels";

const optionalPaise = (v: string) => (v.trim() === "" ? null : rupeesToPaise(v));

/** Store-wide switches. Money fields are typed in rupees and sent as integer paise. */
export function StoreSettingsForm({ settings: s }: { settings: StoreSettings }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(s.isOpen);
  const [closedMessage, setClosedMessage] = useState(s.closedMessage ?? "");
  const [codEnabled, setCodEnabled] = useState(s.codEnabled);
  const [codMax, setCodMax] = useState(paiseToInput(s.codMaxPaise));
  const [deliveryFee, setDeliveryFee] = useState(paiseToInput(s.deliveryFeePaise));
  const [freeAbove, setFreeAbove] = useState(paiseToInput(s.freeDeliveryAbovePaise));
  const [minOrder, setMinOrder] = useState(paiseToInput(s.minOrderPaise));
  const [city, setCity] = useState(s.serviceCity);
  const [lat, setLat] = useState(String(s.serviceLatitude));
  const [lng, setLng] = useState(String(s.serviceLongitude));
  const [radius, setRadius] = useState(String(s.serviceRadiusKm));
  const [dispatchDays, setDispatchDays] = useState(String(s.dispatchDays));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveStoreSettings({
        isOpen,
        closedMessage,
        codEnabled,
        codMaxPaise: optionalPaise(codMax),
        deliveryFeePaise: rupeesToPaise(deliveryFee || "0"),
        freeDeliveryAbovePaise: optionalPaise(freeAbove),
        minOrderPaise: rupeesToPaise(minOrder || "0"),
        serviceability: "geofence",
        serviceCity: city,
        serviceLatitude: Number(lat),
        serviceLongitude: Number(lng),
        serviceRadiusKm: Math.round(Number(radius)),
        dispatchDays: Math.round(Number(dispatchDays || 0)),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Store settings saved");
      router.refresh();
    });
  }

  const money = { inputMode: "decimal" as const, type: "number", min: 0, step: "0.01", className: "tabular-nums" };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <section aria-labelledby="st-open" className="space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 id="st-open" className="text-base font-semibold text-ink">Open for orders</h2>
        <Toggle id="st-is-open" label={isOpen ? "Open: households can order" : "Closed: households can browse but not order"} checked={isOpen} onChange={setIsOpen} />
        {!isOpen && (
          <Field label="Message while closed" htmlFor="st-closed" hint="Optional. Shown at the top of the store.">
            <Textarea id="st-closed" rows={2} maxLength={200} value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)} placeholder="Back on Monday with new kits." />
          </Field>
        )}
      </section>

      <section aria-labelledby="st-pay" className="space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 id="st-pay" className="text-base font-semibold text-ink">Payment</h2>
        <p className="text-sm text-muted">Online payment through Razorpay is always on.</p>
        <Toggle id="st-cod" label="Cash on delivery" checked={codEnabled} onChange={setCodEnabled} />
        {codEnabled && (
          <Field label="COD limit (₹)" htmlFor="st-codmax" hint="Orders above this must pay online. Blank = no limit.">
            <Input id="st-codmax" {...money} value={codMax} onChange={(e) => setCodMax(e.target.value)} />
          </Field>
        )}
      </section>

      <section aria-labelledby="st-fees" className="space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 id="st-fees" className="text-base font-semibold text-ink">Delivery charges</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Delivery fee (₹)" htmlFor="st-fee">
            <Input id="st-fee" required {...money} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
          </Field>
          <Field label="Free above (₹)" htmlFor="st-free" hint="Blank = never free.">
            <Input id="st-free" {...money} value={freeAbove} onChange={(e) => setFreeAbove(e.target.value)} />
          </Field>
          <Field label="Minimum order (₹)" htmlFor="st-min" hint="0 = no minimum.">
            <Input id="st-min" required {...money} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </Field>
        </div>
        <Field label="Dispatch time (days)" htmlFor="st-dispatch" hint="Shown to households as the expected dispatch time. 0 = same day.">
          <Input id="st-dispatch" required type="number" inputMode="numeric" min={0} max={30} step={1} value={dispatchDays} onChange={(e) => setDispatchDays(e.target.value)} className="tabular-nums sm:max-w-[10rem]" />
        </Field>
      </section>

      <section aria-labelledby="st-area" className="space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 id="st-area" className="text-base font-semibold text-ink">Where we deliver</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Delivery area</legend>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-ink bg-surface px-3 py-2.5">
            <input type="radio" name="serviceability" value="geofence" checked readOnly className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            <span>
              <span className="block text-sm font-semibold text-ink">One city, by distance</span>
              <span className="block text-xs text-muted">Addresses within the radius below can order.</span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-not-allowed items-start gap-3 rounded-control border border-line bg-app-canvas px-3 py-2.5 opacity-70">
            <input type="radio" name="serviceability" value="india" disabled className="mt-1 h-4 w-4" aria-describedby="st-india-note" />
            <span>
              <span className="block text-sm font-semibold text-ink">All of India by courier</span>
              <span id="st-india-note" className="block text-xs text-muted">Coming soon. Not available yet.</span>
            </span>
          </label>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City name" htmlFor="st-city" hint="Shown to households outside the area.">
            <Input id="st-city" required minLength={2} maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Radius (km)" htmlFor="st-radius">
            <Input id="st-radius" required type="number" inputMode="numeric" min={1} max={200} step={1} value={radius} onChange={(e) => setRadius(e.target.value)} className="tabular-nums" />
          </Field>
          <Field label="Centre latitude" htmlFor="st-lat">
            <Input id="st-lat" required type="number" inputMode="decimal" min={-90} max={90} step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="tabular-nums" />
          </Field>
          <Field label="Centre longitude" htmlFor="st-lng">
            <Input id="st-lng" required type="number" inputMode="decimal" min={-180} max={180} step="any" value={lng} onChange={(e) => setLng(e.target.value)} className="tabular-nums" />
          </Field>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
