"use client";

import { useState, useTransition } from "react";
import { VENDOR_TYPES, VENDOR_TYPE_INFO, type VendorType } from "@/core/vendor-types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { adminAddAdmin, adminRemoveAdmin, adminSaveCategory, adminSaveDiscoveryRadius, adminSaveLocality } from "@/features/admin/actions";

const input = "w-full rounded-[8px] border border-line bg-surface px-2 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:bg-bg disabled:text-muted";
const saveButton = "h-8 rounded-[8px] bg-ink px-3 text-xs font-semibold text-white transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";
const COLOUR_LABELS = { tint: "Tile colour", coverFrom: "Cover start colour", coverTo: "Cover end colour" } as const;

function useSave() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Could not save");
      else {
        toast.success(done);
        after?.();
        router.refresh();
      }
    });
  return { pending, run };
}

export interface CategoryRow {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  blurb: string;
  tint: string;
  coverFrom: string;
  coverTo: string;
  sort: number;
  isActive: boolean;
  fulfilment: string;
  vendorType: string;
}

const BLANK_CATEGORY: CategoryRow = { id: "", label: "", shortLabel: "", emoji: "🛍️", blurb: "", tint: "#F4F4F5", coverFrom: "#F4F4F5", coverTo: "#FFFFFF", sort: 10, isActive: true, fulfilment: "delivery", vendorType: "store" };

function CategoryEditor({ row, isNew }: { row: CategoryRow; isNew?: boolean }) {
  const [f, setF] = useState(row);
  const { pending, run } = useSave();
  const set = (k: keyof CategoryRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: k === "sort" ? Number(e.target.value) : k === "isActive" ? e.target.checked : e.target.value });
  return (
    <tr className="align-top">
      <td className="p-2"><input className={input + " w-14 text-center text-lg"} value={f.emoji} onChange={set("emoji")} aria-label="Emoji" /></td>
      <td className="p-2"><input className={input + " font-mono"} value={f.id} onChange={set("id")} disabled={!isNew} aria-label="Id" placeholder="laundry" /></td>
      <td className="p-2"><input className={input} value={f.label} onChange={set("label")} aria-label="Label" placeholder="Laundry" /></td>
      <td className="p-2"><input className={input} value={f.shortLabel} onChange={set("shortLabel")} aria-label="Short label" /></td>
      <td className="p-2"><input className={input} value={f.blurb} onChange={set("blurb")} aria-label="Blurb" /></td>
      <td className="p-2">
        <div className="flex gap-1">
          {(["tint", "coverFrom", "coverTo"] as const).map((k) => (
            <input key={k} type="color" value={f[k]} onChange={set(k)} aria-label={COLOUR_LABELS[k]} title={COLOUR_LABELS[k]} className="h-8 w-8 cursor-pointer rounded border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
          ))}
        </div>
      </td>
      <td className="p-2">
        {/* The vendor type picks which tables and merchant tools its vendors get. Fixed once vendors exist. */}
        <select
          value={f.vendorType}
          disabled={!isNew}
          onChange={(e) => {
            const t = e.target.value as VendorType;
            setF({ ...f, vendorType: t, fulfilment: VENDOR_TYPE_INFO[t].fulfilment });
          }}
          aria-label="Vendor type"
          className={input + " w-40"}
        >
          {VENDOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {VENDOR_TYPE_INFO[t].label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2"><input className={input + " w-16"} type="number" value={f.sort} onChange={set("sort")} aria-label="Sort" /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={f.isActive} onChange={set("isActive")} aria-label="Active" className="mt-2 h-4 w-4 accent-accent" /></td>
      <td className="p-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => adminSaveCategory(f), isNew ? "Category added" : "Saved", () => isNew && setF(BLANK_CATEGORY))}
          className={saveButton}
        >
          {isNew ? "Add" : "Save"}
        </button>
      </td>
    </tr>
  );
}

export function CategoriesEditor({ rows }: { rows: CategoryRow[] }) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-line bg-surface">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
          <tr>{["Emoji", "Id", "Label", "Short", "Blurb", "Colours", "Vendor type", "Order", "On", "Action"].map((h, i) => <th key={i} scope="col" className="p-2 font-semibold"><span className={i === 0 || i === 9 ? "sr-only" : undefined}>{h}</span></th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => <CategoryEditor key={r.id} row={r} />)}
          <CategoryEditor row={BLANK_CATEGORY} isNew />
        </tbody>
      </table>
    </div>
  );
}

export interface LocalityRow {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

const BLANK_LOCALITY = { id: "", name: "", city: "", state: "", latitude: "", longitude: "", isActive: true };

function LocalityEditor({ row, isNew }: { row: LocalityRow | null; isNew?: boolean }) {
  const [f, setF] = useState(row ? { ...row, latitude: String(row.latitude), longitude: String(row.longitude) } : BLANK_LOCALITY);
  const { pending, run } = useSave();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: k === "isActive" ? e.target.checked : e.target.value });
  return (
    <tr>
      <td className="p-2"><input className={input + " font-mono"} value={f.id} onChange={set("id")} disabled={!isNew} aria-label="Id" placeholder="rnc-lalpur" /></td>
      <td className="p-2"><input className={input} value={f.name} onChange={set("name")} aria-label="Name" /></td>
      <td className="p-2"><input className={input} value={f.city} onChange={set("city")} aria-label="City" /></td>
      <td className="p-2"><input className={input} value={f.state} onChange={set("state")} aria-label="State" /></td>
      <td className="p-2"><input className={input + " font-mono"} value={f.latitude} onChange={set("latitude")} aria-label="Latitude" /></td>
      <td className="p-2"><input className={input + " font-mono"} value={f.longitude} onChange={set("longitude")} aria-label="Longitude" /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={f.isActive} onChange={set("isActive")} aria-label="Active" className="h-4 w-4 accent-accent" /></td>
      <td className="p-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            // Number("") is 0: a blank field would otherwise save the locality at 0°, 0°.
            if (f.latitude.trim() === "" || f.longitude.trim() === "") {
              toast.error("Enter latitude and longitude");
              return;
            }
            run(
              () => adminSaveLocality({ ...f, latitude: Number(f.latitude), longitude: Number(f.longitude) }),
              isNew ? "Locality added" : "Saved",
              () => isNew && setF(BLANK_LOCALITY)
            );
          }}
          className={saveButton}
        >
          {isNew ? "Add" : "Save"}
        </button>
      </td>
    </tr>
  );
}

export function LocalitiesEditor({ rows }: { rows: LocalityRow[] }) {
  return (
    <div className="max-h-[520px] overflow-auto rounded-[12px] border border-line bg-surface">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="sticky top-0 border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
          <tr>{["Id", "Name", "City", "State", "Lat", "Lng", "On", "Action"].map((h, i) => <th key={i} scope="col" className="p-2 font-semibold"><span className={i === 7 ? "sr-only" : undefined}>{h}</span></th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          <LocalityEditor row={null} isNew />
          {rows.map((r) => <LocalityEditor key={r.id} row={r} />)}
        </tbody>
      </table>
    </div>
  );
}

export function AdminsEditor({ rows }: { rows: { id: string; email: string | null; userId: string | null }[] }) {
  const [email, setEmail] = useState("");
  const { pending, run } = useSave();
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0 break-all font-mono text-xs">{r.email ?? `user ${r.userId}`}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => window.confirm(`Remove ${r.email ?? "this admin"}? They lose access to the admin console.`) && run(() => adminRemoveAdmin({ id: r.id }), "Admin removed")}
              aria-label={`Remove admin ${r.email ?? r.userId ?? ""}`.trim()}
              className="min-h-9 shrink-0 rounded-[8px] px-2 text-xs font-semibold text-bad hover:bg-bad/5 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => adminAddAdmin({ email }), "Admin added", () => setEmail(""));
        }}
      >
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new-admin@example.com" aria-label="New admin email" autoComplete="off" className={inputClass + " min-w-0 flex-1"} />
        <button type="submit" disabled={pending} className={buttonClass("dark", "md")}>Add admin</button>
      </form>
      <p className="text-xs text-muted">Admins sign in at /admin/sign-in (email and password, or Google). Email admins need a verified email.</p>
    </div>
  );
}

export function DiscoveryRadiusEditor({ value }: { value: number }) {
  const [km, setKm] = useState(String(value));
  const { pending, run } = useSave();
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => adminSaveDiscoveryRadius({ discoveryRadiusKm: Math.round(Number(km)) }), "Radius saved");
      }}
    >
      <label className="text-sm font-medium">
        Default search radius (km)
        <input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} className={inputClass + " mt-1 block w-28 tabular-nums"} />
      </label>
      <button type="submit" disabled={pending} className={buttonClass("dark", "md")}>Save</button>
    </form>
  );
}
