"use client";


import { AppIcon, UiIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminCreateVendor, adminUpdateVendor, type Credentials } from "@/features/admin/actions";
import { CredentialsView } from "./credentials-panel";
import { LocationPicker } from "@/features/platform/components/location-picker";
import { VendorTypePicker } from "./vendor-type-picker";
import type { OnboardCategory, VendorFormValues } from "./vendor-form-values";

const input = "mt-1 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const labelCls = "block text-xs font-medium text-ink";

/** Accepts 98765 43210, 098765 43210 or +91 98765 43210; the server wants +919876543210. */
function normalizePhone(v: string) {
  const digits = v.replace(/[^\d+]/g, "").replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^\d{10}$/.test(digits) ? "+91" + digits : v.trim();
}

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
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof VendorFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setF((prev) => ({ ...prev, [k]: value, ...(k === "name" && !slugTouched ? { slug: slugify(value) } : {}) }));
  };

  if (created) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UiIcon name="check" className="h-6 w-6 text-accent" />
          <h2 className="text-lg font-semibold text-ink">{f.name} is live</h2>
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

  const appQuery = f.applicationId ? `?application=${f.applicationId}` : "";

  // Step 1 for a new vendor: what kind of business is joining? Each type has its own URL.
  if (isNew && !f.categoryId) {
    return (
      <VendorTypePicker
        categories={categories}
        onPick={(c) => router.push(`/admin/vendors/new/${c.id}${appQuery}`)}
      />
    );
  }
  const chosen = categories.find((c) => c.id === f.categoryId);
  // An application prefill sets only the category, so read fulfilment from it when known.
  const booking = chosen ? chosen.fulfilment === "booking" : f.businessType === "booking";

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
        setError(null);
        const details = {
          name: f.name,
          phone: normalizePhone(f.phone),
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
            const res = await adminCreateVendor({ ...details, slug: f.slug, categoryId: f.categoryId, applicationId: f.applicationId });
            if (!res.ok) setError(res.error);
            else setCreated(res);
          } else {
            const res = await adminUpdateVendor({ ...details, vendorId: f.vendorId, plan: f.plan, acceptingOrders: f.acceptingOrders });
            if (!res.ok) setError(res.error);
            else {
              toast.success("Saved");
              router.refresh();
            }
          }
        });
      }}
    >
      {isNew && (
        <div className="flex items-center gap-3 rounded-[12px] border border-line bg-bg p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: chosen?.tint }}>
            <AppIcon name={f.categoryId} className="h-5 w-5 text-ink" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{chosen?.label ?? f.categoryId}</span>
            <span className="block text-xs text-muted">{booking ? "Bookable sessions" : "Delivery store"}</span>
          </span>
          <Link href={`/admin/vendors/new${appQuery}`} className="flex h-9 items-center rounded-[8px] border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-ink/40">
            Change type
          </Link>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-ink">Business</legend>
        <label className={labelCls}>Business name<input required autoFocus={isNew} className={input} value={f.name} onChange={set("name")} /></label>
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
        <label className={labelCls}>
          Mobile number
          <input required type="tel" inputMode="tel" autoComplete="off" className={input + " font-mono"} value={f.phone} onChange={set("phone")} placeholder="98765 43210" />
          <span className="mt-1 block text-[11px] text-muted">10 digits; +91 is added for you. Households never see it.</span>
        </label>
        <label className={labelCls}>Payout UPI ID<input required className={input + " font-mono"} value={f.upiVpa} onChange={set("upiVpa")} placeholder="name@upi" /></label>
        <label className={labelCls + " sm:col-span-2"}>{booking ? "About the provider" : "About the store"}<textarea rows={2} className={input} value={f.description} onChange={set("description")} maxLength={400} /></label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-ink">{booking ? "Location & home visits" : "Location & delivery"}</legend>
        <label className={labelCls}>Area<input required className={input} value={f.area} onChange={set("area")} placeholder="Lalpur" /></label>
        <label className={labelCls}>City<input required className={input} value={f.city} onChange={set("city")} placeholder="Ranchi" /></label>
        <div className="sm:col-span-2">
          <LocationPicker
            value={{ latitude: f.latitude, longitude: f.longitude, mapsUrl: f.mapsUrl }}
            onChange={(v) => setF((prev) => ({ ...prev, latitude: v.latitude, longitude: v.longitude, mapsUrl: v.mapsUrl }))}
          />
        </div>
        <label className={labelCls}>{booking ? "Home-visit radius (km)" : "Delivery radius (km)"}<input className={input + " tabular-nums"} inputMode="numeric" value={f.serviceRadiusKm} onChange={set("serviceRadiusKm")} /></label>
        <label className={labelCls}>{booking ? "Visit fee (₹)" : "Delivery fee (₹)"}<input className={input + " tabular-nums"} inputMode="decimal" value={f.deliveryFeeRupees} onChange={set("deliveryFeeRupees")} /></label>
        {!booking && <label className={labelCls}>Minimum order (₹)<input className={input + " tabular-nums"} inputMode="decimal" value={f.minOrderRupees} onChange={set("minOrderRupees")} /></label>}
        <label className={labelCls}>RUXs fee on online payments (%)<input className={input + " tabular-nums"} inputMode="decimal" value={f.commissionPercent} onChange={set("commissionPercent")} /></label>
      </fieldset>

      {!isNew && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-base font-semibold text-ink">Plan</legend>
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

      <div className="sticky bottom-0 space-y-2 border-t border-line bg-surface py-3 sm:static sm:border-0 sm:p-0">
        {error && (
          <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="h-12 w-full rounded-[12px] bg-accent text-sm font-bold text-white disabled:opacity-60 sm:w-auto sm:px-8">
          {pending ? "Saving…" : isNew ? "Create vendor & generate login" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
