"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { rupeesToPaise } from "@/core/money";
import { saveStoreSettings } from "../actions";
import type { StoreSettings } from "../types";
import { ErrorNote } from "./seller-ui";
import { paiseToInput } from "./store-labels";
import { useStoreAction } from "./use-store-action";

const optionalPaise = (v: string) => (v.trim() === "" ? null : rupeesToPaise(v));
const whole = (v: string) => Math.round(Number(v || 0));

const section = "space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5";
const heading = "text-base font-semibold text-ink";

/** Store-wide switches. Money fields are typed in rupees and sent as integer paise. */
export function StoreSettingsForm({ settings: s }: { settings: StoreSettings }) {
  const { pending, error, run } = useStoreAction();
  const [isOpen, setIsOpen] = useState(s.isOpen);
  const [closedMessage, setClosedMessage] = useState(s.closedMessage ?? "");
  const [codEnabled, setCodEnabled] = useState(s.codEnabled);
  const [codMax, setCodMax] = useState(paiseToInput(s.codMaxPaise));
  const [deliveryFee, setDeliveryFee] = useState(paiseToInput(s.deliveryFeePaise));
  const [freeAbove, setFreeAbove] = useState(paiseToInput(s.freeDeliveryAbovePaise));
  const [minOrder, setMinOrder] = useState(paiseToInput(s.minOrderPaise));
  const [etaMin, setEtaMin] = useState(String(s.defaultEtaMinDays));
  const [etaMax, setEtaMax] = useState(String(s.defaultEtaMaxDays));
  const [dispatchDays, setDispatchDays] = useState(String(s.dispatchDays));
  const [returnDays, setReturnDays] = useState(String(s.returnWindowDays));
  const [autoForward, setAutoForward] = useState(s.autoForward);
  const [mode, setMode] = useState<"india" | "geofence">(s.serviceability);
  const [city, setCity] = useState(s.serviceCity);
  const [lat, setLat] = useState(String(s.serviceLatitude));
  const [lng, setLng] = useState(String(s.serviceLongitude));
  const [radius, setRadius] = useState(String(s.serviceRadiusKm));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () =>
        saveStoreSettings({
          isOpen,
          closedMessage,
          codEnabled,
          codMaxPaise: optionalPaise(codMax),
          deliveryFeePaise: rupeesToPaise(deliveryFee || "0"),
          freeDeliveryAbovePaise: optionalPaise(freeAbove),
          minOrderPaise: rupeesToPaise(minOrder || "0"),
          defaultEtaMinDays: whole(etaMin),
          defaultEtaMaxDays: whole(etaMax),
          returnWindowDays: whole(returnDays),
          autoForward,
          serviceability: mode,
          serviceCity: city,
          serviceLatitude: Number(lat),
          serviceLongitude: Number(lng),
          serviceRadiusKm: whole(radius),
          dispatchDays: whole(dispatchDays),
        }),
      { success: "Store settings saved" }
    );
  }

  const money = { inputMode: "decimal" as const, type: "number", min: 0, step: "0.01", className: "tabular-nums" };
  const days = { inputMode: "numeric" as const, type: "number", min: 0, step: 1, className: "tabular-nums" };
  const modes = [
    { v: "india" as const, title: "All of India by courier", body: "Any valid PIN code can order. Shipping zones set the fee, delivery time and COD." },
    { v: "geofence" as const, title: "One city, by distance", body: "Only addresses within the radius below can order." },
  ];

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <section aria-labelledby="st-open" className={section}>
        <h2 id="st-open" className={heading}>Open for orders</h2>
        <Toggle id="st-is-open" label={isOpen ? "Open: households can order" : "Closed: households can browse but not order"} checked={isOpen} onChange={setIsOpen} />
        {!isOpen && (
          <Field label="Message while closed" htmlFor="st-closed" hint="Optional. Shown at the top of the store.">
            <Textarea id="st-closed" rows={2} maxLength={200} value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)} placeholder="Back on Monday with new kits." />
          </Field>
        )}
      </section>

      <section aria-labelledby="st-pay" className={section}>
        <h2 id="st-pay" className={heading}>Payment</h2>
        <p className="text-sm text-muted">Online payment through Razorpay is always on.</p>
        <Toggle id="st-cod" label="Cash on delivery" checked={codEnabled} onChange={setCodEnabled} />
        {codEnabled && (
          <Field label="COD limit (₹)" htmlFor="st-codmax" hint="Orders above this must pay online. Blank = no limit. A shipping zone can also switch COD off.">
            <Input id="st-codmax" {...money} value={codMax} onChange={(e) => setCodMax(e.target.value)} />
          </Field>
        )}
      </section>

      <section aria-labelledby="st-fees" className={section}>
        <h2 id="st-fees" className={heading}>Delivery charges and time</h2>
        <p className="text-sm text-muted">These apply to any PIN code that no shipping zone covers.</p>
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
          <Field label="Fastest delivery (days)" htmlFor="st-eta-min">
            <Input id="st-eta-min" required {...days} max={60} value={etaMin} onChange={(e) => setEtaMin(e.target.value)} />
          </Field>
          <Field label="Slowest delivery (days)" htmlFor="st-eta-max">
            <Input id="st-eta-max" required {...days} max={60} value={etaMax} onChange={(e) => setEtaMax(e.target.value)} />
          </Field>
          <Field label="Dispatch time (days)" htmlFor="st-dispatch" hint="0 = same day.">
            <Input id="st-dispatch" required {...days} max={30} value={dispatchDays} onChange={(e) => setDispatchDays(e.target.value)} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="st-returns" className={section}>
        <h2 id="st-returns" className={heading}>Returns</h2>
        <Field label="Return window (days after delivery)" htmlFor="st-return" hint="0 switches returns off. Households ask from their order page.">
          <Input id="st-return" required {...days} max={90} value={returnDays} onChange={(e) => setReturnDays(e.target.value)} className="tabular-nums sm:max-w-[10rem]" />
        </Field>
      </section>

      <section aria-labelledby="st-forward" className={section}>
        <h2 id="st-forward" className={heading}>Fulfilment partners</h2>
        <Toggle id="st-auto" label="Forward new orders to the best-matching partner automatically" checked={autoForward} onChange={setAutoForward} />
        <p className="text-sm text-muted">
          When off, forward each order by hand from its page. Partners are internal: households only ever see Shipped by RUXs.
        </p>
      </section>

      <section aria-labelledby="st-area" className={section}>
        <h2 id="st-area" className={heading}>Where we deliver</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Delivery area</legend>
          {modes.map((m) => (
            <label
              key={m.v}
              className={
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border bg-surface px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent " +
                (mode === m.v ? "border-ink" : "border-line")
              }
            >
              <input type="radio" name="serviceability" value={m.v} checked={mode === m.v} onChange={() => setMode(m.v)} className="mt-1 h-4 w-4 accent-[var(--color-accent)]" />
              <span>
                <span className="block text-sm font-semibold text-ink">{m.title}</span>
                <span className="block text-xs text-muted">{m.body}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {mode === "geofence" && (
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
        )}
      </section>

      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
