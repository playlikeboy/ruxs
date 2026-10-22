"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminCreateVendor, adminUpdateVendor, type Credentials } from "@/features/admin/actions";
import { CredentialsView } from "./credentials-panel";
import { LocationPicker } from "@/features/platform/components/location-picker";

export interface VendorFormValues {
  vendorId?: string;
  slug: string;
  name: string;
  phone: string;
  upiVpa: string;
  city: string;
  area: string;
  description: string;
  latitude: string;
  longitude: string;
  serviceRadiusKm: string;
  deliveryFeeRupees: string;
  minOrderRupees: string;
  commissionPercent: string;
  plan: "free" | "starter" | "pro";
  acceptingOrders: boolean;
  businessType: "delivery" | "booking";
  categoryId: string;
  mapsUrl: string;
}

export interface OnboardCategory {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  fulfilment: string;
  tint: string;
}

export const EMPTY_VENDOR: VendorFormValues = {
  slug: "",
  name: "",
  phone: "+91",
  upiVpa: "",
  city: "",
  area: "",
  description: "",
  latitude: "",
  longitude: "",
  serviceRadiusKm: "8",
  deliveryFeeRupees: "0",
  minOrderRupees: "0",
  commissionPercent: "0",
  plan: "free",
  acceptingOrders: true,
  businessType: "delivery",
  categoryId: "",
  mapsUrl: "",
};

const input = "mt-1 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const labelCls = "block text-xs font-medium text-ink";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function VendorForm({ initial, categories = [] }: { initial: VendorFormValues; categories?: OnboardCategory[] }) {
  const router = useRouter();
  const isNew = !initial.vendorId;
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<{ vendorId: string; credentials: Credentials | null; warning: string | null } | null>(null);

  const set = (k: keyof VendorFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setF((prev) => ({ ...prev, [k]: value, ...(k === "name" && !slugTouched ? { slug: slugify(value) } : {}) }));
  };

  if (created) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">✓</span>
          <h2 className="text-lg font-semibold text-ink">{f.name} is live &amp; Auto-Approved</h2>
        </div>
        {created.credentials ? (
          <CredentialsView credentials={created.credentials} />
        ) : (
          <p className="rounded-[10px] bg-butter p-3 text-sm text-warn">Store created, but the login could not be generated: {created.warning}. Open the vendor and try again.</p>
        )}
        <div className="flex gap-3">
          <Link href={`/admin/vendors/${created.vendorId}`} className="flex h-11 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white">Open vendor</Link>
          <Link href="/admin/vendors" className="flex h-11 items-center rounded-[10px] border border-line px-4 text-sm font-semibold">Back to list</Link>
        </div>
      </div>
    );
  }

  function num(v: string) {
    return v.trim() === "" ? 0 : Number(v);
  }

  // Step 1 for a new vendor: what kind of business is joining?
  if (isNew && !f.categoryId) {
    const dailyCats = categories.filter((c) => !c.id.startsWith("kids_") && c.id !== "kids");
    const kidsCats = categories.filter((c) => c.id.startsWith("kids_") || c.id === "kids");

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">What are you onboarding?</h2>
          <p className="text-xs text-muted">Auto-approves the vendor and configures their dedicated database tables and workspace tools.</p>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Daily Essentials &amp; Household Services</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dailyCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setF({ ...f, categoryId: c.id, businessType: c.fulfilment === "booking" ? "booking" : "delivery" })}
                className="flex items-center gap-3 rounded-[14px] border border-line p-3 text-left transition hover:border-ink hover:scale-101"
                style={{ backgroundColor: c.tint }}
              >
                <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
                <div>
                  <span className="block text-sm font-semibold text-ink">{c.label}</span>
                  <span className="block text-[11px] text-muted">{c.fulfilment === "booking" ? "Bookable sessions" : "Delivery store"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border-2 border-kids-grape/25 bg-kids-cream/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🧸</span>
            <div>
              <h3 className="text-sm font-black text-kids-ink">Ruxs Kids (10 Differentiated Vendor Types)</h3>
              <p className="text-[11px] font-medium text-kids-ink/70">Each type gets separate profile &amp; item database tables, certificates &amp; video preview.</p>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {kidsCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setF({ ...f, categoryId: c.id, businessType: c.fulfilment === "booking" ? "booking" : "delivery" })}
                className="flex items-start gap-2.5 rounded-[12px] border-2 border-kids-grape/15 bg-white p-3 text-left shadow-xs transition hover:border-kids-grape hover:scale-101"
              >
                <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{c.emoji}</span>
                <div>
                  <span className="block text-xs font-black text-kids-ink leading-tight">{c.label}</span>
                  <span className="block text-[10px] text-kids-ink/70 mt-0.5">{c.blurb || (c.fulfilment === "delivery" ? "Doorstep DIY kits" : "Sessions & workshops")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const chosen = categories.find((c) => c.id === f.categoryId);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const latitude = f.latitude.trim() === "" ? null : Number(f.latitude);
        const longitude = f.longitude.trim() === "" ? null : Number(f.longitude);
        if ((latitude === null) !== (longitude === null)) {
          toast.error("Enter both latitude and longitude, or neither");
          return;
        }
        const details = {
          name: f.name,
          phone: f.phone,
          upiVpa: f.upiVpa,
          city: f.city,
          area: f.area,
          description: f.description,
          latitude,
          longitude,
          serviceRadiusKm: Math.round(num(f.serviceRadiusKm)),
          deliveryFeeRupees: num(f.deliveryFeeRupees),
          minOrderRupees: num(f.minOrderRupees),
          commissionPercent: num(f.commissionPercent),
          mapsUrl: f.mapsUrl,
        };
        startTransition(async () => {
          if (isNew) {
            const res = await adminCreateVendor({ ...details, slug: f.slug, categoryId: f.categoryId });
            if (!res.ok) toast.error(res.error);
            else setCreated(res);
          } else {
            const res = await adminUpdateVendor({ ...details, vendorId: f.vendorId, plan: f.plan, acceptingOrders: f.acceptingOrders });
            if (!res.ok) toast.error(res.error);
            else {
              toast.success("Saved");
              router.refresh();
            }
          }
        });
      }}
    >
      {isNew && chosen && (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line p-3" style={{ backgroundColor: chosen.tint }}>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-2xl" aria-hidden="true">{chosen.emoji}</span> Onboarding: {chosen.label}
            <span className="font-normal text-muted">· {chosen.fulfilment === "booking" ? "booking provider" : "delivery store"}</span>
          </span>
          <button type="button" onClick={() => setF({ ...f, categoryId: "" })} className="text-xs font-semibold text-accent">Change</button>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Business</legend>
        <label className={labelCls}>Business name<input required className={input} value={f.name} onChange={set("name")} /></label>
        <label className={labelCls}>
          Store URL / login ID
          <input
            required
            disabled={!isNew}
            className={input + " font-mono disabled:bg-bg disabled:text-muted"}
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug")(e);
            }}
          />
          <span className="mt-1 block text-[11px] text-muted">ruxs.in/app/store/{f.slug || "…"}</span>
        </label>
        <label className={labelCls}>Phone (+91…)<input required className={input + " font-mono"} value={f.phone} onChange={set("phone")} /></label>
        <label className={labelCls}>Payout UPI ID<input required className={input + " font-mono"} value={f.upiVpa} onChange={set("upiVpa")} placeholder="name@upi" /></label>
        <label className={labelCls + " sm:col-span-2"}>About the store<textarea rows={2} className={input} value={f.description} onChange={set("description")} maxLength={400} /></label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Location &amp; delivery</legend>
        <label className={labelCls}>Area<input required className={input} value={f.area} onChange={set("area")} placeholder="Lalpur" /></label>
        <label className={labelCls}>City<input required className={input} value={f.city} onChange={set("city")} placeholder="Ranchi" /></label>
        <div className="sm:col-span-2">
          <LocationPicker
            value={{ latitude: f.latitude, longitude: f.longitude, mapsUrl: f.mapsUrl }}
            onChange={(v) => setF((prev) => ({ ...prev, latitude: v.latitude, longitude: v.longitude, mapsUrl: v.mapsUrl }))}
          />
        </div>
        <label className={labelCls}>Delivery radius (km)<input className={input} inputMode="numeric" value={f.serviceRadiusKm} onChange={set("serviceRadiusKm")} /></label>
        <label className={labelCls}>Delivery fee (₹)<input className={input} inputMode="decimal" value={f.deliveryFeeRupees} onChange={set("deliveryFeeRupees")} /></label>
        <label className={labelCls}>Minimum order (₹)<input className={input} inputMode="decimal" value={f.minOrderRupees} onChange={set("minOrderRupees")} /></label>
        <label className={labelCls}>RUXs fee on online payments (%)<input className={input} inputMode="decimal" value={f.commissionPercent} onChange={set("commissionPercent")} /></label>
      </fieldset>

      {!isNew && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Plan</legend>
          <label className={labelCls}>
            Plan
            <select className={input} value={f.plan} onChange={set("plan")}>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
            <input type="checkbox" checked={f.acceptingOrders} onChange={(e) => setF({ ...f, acceptingOrders: e.target.checked })} className="h-4 w-4 accent-[#BD4B2A]" />
            Taking one-time orders
          </label>
        </fieldset>
      )}

      <button type="submit" disabled={pending} className="h-12 w-full rounded-[12px] bg-accent text-sm font-bold text-white disabled:opacity-60 sm:w-auto sm:px-8">
        {pending ? "Saving…" : isNew ? "Create vendor & generate login" : "Save changes"}
      </button>
    </form>
  );
}
