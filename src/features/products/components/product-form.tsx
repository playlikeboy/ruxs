"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { archiveProduct, saveProduct } from "@/features/products/actions";

export interface EditableProduct {
  id: string;
  kind: string;
  name: string;
  description: string | null;
  section: string | null;
  imageUrl: string | null;
  isVeg: boolean | null;
  shift: string;
  pricePaise: number;
  depositPaise: number;
  assetName: string | null;
  cutoffAt: string;
  lateRule: string;
  isAvailable: boolean;
  allowSubscription: boolean;
  allowOneTime: boolean;
}

type Shift = "lunch" | "dinner" | "morning" | "evening";
type LateRule = "free" | "half" | "full" | "locked";

/** Sensible defaults for well-known categories; anything else starts as a morning item. */
const KNOWN_DEFAULTS: Record<string, { shift: Shift; asset: string; cutoff: string }> = {
  tiffin: { shift: "lunch", asset: "dabba", cutoff: "10:00" },
  water: { shift: "morning", asset: "can", cutoff: "08:00" },
  milk: { shift: "morning", asset: "", cutoff: "21:00" },
};
const defaultsFor = (kind: string) => KNOWN_DEFAULTS[kind] ?? { shift: "morning" as Shift, asset: "", cutoff: "09:00" };

/** Add or edit one menu item. The category is the store's own, so it is never asked. */
export function ProductForm({ slug, kind, product, sections, defaultSection = "" }: { slug: string; kind: string; product?: EditableProduct; sections: string[]; defaultSection?: string }) {
  const router = useRouter();
  const back = `/merchant-panel/${slug}/products`;
  const d = defaultsFor(kind);
  const [v, setV] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    section: product?.section ?? defaultSection,
    imageUrl: product?.imageUrl ?? "",
    isVeg: product ? product.isVeg : kind === "tiffin" ? true : null,
    price: product ? String(product.pricePaise / 100) : "",
    deposit: product ? String(product.depositPaise / 100) : "0",
    assetName: product?.assetName ?? d.asset,
    shift: (product?.shift as Shift) ?? d.shift,
    cutoffAt: product?.cutoffAt ?? d.cutoff,
    lateRule: (product?.lateRule as LateRule) ?? "full",
    isAvailable: product?.isAvailable ?? true,
    allowOneTime: product?.allowOneTime ?? true,
    allowSubscription: product?.allowSubscription ?? true,
  });
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((p) => ({ ...p, [k]: value }));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const food = kind === "tiffin" || kind === "other";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceRupees = Number(v.price);
    if (!Number.isFinite(priceRupees) || priceRupees <= 0) return setError("Enter a price above ₹0.");
    if (!v.allowOneTime && !v.allowSubscription) return setError("Allow one-time orders, subscriptions, or both.");
    setError(null);
    start(async () => {
      const res = await saveProduct({
        slug,
        id: product?.id,
        kind,
        name: v.name,
        description: v.description,
        section: v.section,
        imageUrl: v.imageUrl,
        isVeg: food ? v.isVeg : null,
        shift: v.shift,
        priceRupees,
        depositRupees: Number(v.deposit) || 0,
        assetName: v.assetName,
        cutoffAt: v.cutoffAt,
        lateRule: v.lateRule,
        isAvailable: v.isAvailable,
        allowSubscription: v.allowSubscription,
        allowOneTime: v.allowOneTime,
      });
      if (!res.ok) return setError(res.error ?? "Could not save the item.");
      toast.success(product ? "Item updated" : "Item added");
      router.push(back);
      router.refresh();
    });
  }

  function archive() {
    if (!product || !window.confirm(`Archive "${product.name}"? Households stop seeing it. Past orders keep it.`)) return;
    start(async () => {
      const res = await archiveProduct({ slug, id: product.id });
      if (!res.ok) return setError(res.error ?? "Could not archive.");
      toast.success("Item archived");
      router.push(back);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <Field label="Name" htmlFor="p-name">
        <Input id="p-name" required minLength={2} maxLength={80} autoFocus={!product} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder={kind === "water" ? "20L RO water can" : "Veg lunch thali"} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)" htmlFor="p-price">
          <Input id="p-price" required inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="90" className="tabular-nums" />
        </Field>
        <Field label="Menu section" htmlFor="p-section" hint="Groups items on your store.">
          <Input id="p-section" list="p-sections" maxLength={40} value={v.section} onChange={(e) => set("section", e.target.value)} placeholder="Thalis" />
          <datalist id="p-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
      </div>
      <Field label="What's included" htmlFor="p-desc">
        <Textarea id="p-desc" rows={2} maxLength={300} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="4 roti, rice, dal, sabzi, salad" />
      </Field>
      <ImageUpload label="Photo" hint="Optional. Shown on your store and in the cart." value={v.imageUrl || null} onChange={(url) => set("imageUrl", url ?? "")} />
      {food && (
        <Field label="Food type" htmlFor="p-veg">
          <Select id="p-veg" value={v.isVeg == null ? "none" : v.isVeg ? "veg" : "nonveg"} onChange={(e) => set("isVeg", e.target.value === "none" ? null : e.target.value === "veg")}>
            <option value="veg">Veg</option>
            <option value="nonveg">Non-veg</option>
            <option value="none">Not food</option>
          </Select>
        </Field>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle id="p-avail" label="In stock" checked={v.isAvailable} onChange={(x) => set("isAvailable", x)} />
        <Toggle id="p-once" label="One-time orders" checked={v.allowOneTime} onChange={(x) => set("allowOneTime", x)} />
        <Toggle id="p-sub" label="Subscriptions" checked={v.allowSubscription} onChange={(x) => set("allowSubscription", x)} />
      </div>

      <details className="rounded-[12px] border border-line bg-surface px-4 py-3" open={!!product && (v.assetName !== d.asset || v.cutoffAt !== d.cutoff)}>
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Delivery rules <span className="font-normal text-muted">· {v.shift}, order by {v.cutoffAt}{v.assetName ? `, returnable ${v.assetName}` : ""}</span>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Delivered" htmlFor="p-shift">
            <Select id="p-shift" value={v.shift} onChange={(e) => set("shift", e.target.value as Shift)}>
              <option value="morning">Morning</option>
              <option value="lunch">Lunch</option>
              <option value="evening">Evening</option>
              <option value="dinner">Dinner</option>
            </Select>
          </Field>
          <Field label="Order by (India time)" htmlFor="p-cutoff">
            <Input id="p-cutoff" type="time" required value={v.cutoffAt} onChange={(e) => set("cutoffAt", e.target.value)} />
          </Field>
          <Field label="Skip after cutoff" htmlFor="p-late" className="col-span-2">
            <Select id="p-late" value={v.lateRule} onChange={(e) => set("lateRule", e.target.value as LateRule)}>
              <option value="free">No charge</option>
              <option value="half">Half charge</option>
              <option value="full">Full charge</option>
              <option value="locked">Not allowed</option>
            </Select>
          </Field>
          <Field label="Returnable item" htmlFor="p-asset" hint="Like can or dabba. Empty if none.">
            <Input id="p-asset" maxLength={30} value={v.assetName} onChange={(e) => set("assetName", e.target.value)} />
          </Field>
          <Field label="Deposit (₹)" htmlFor="p-dep">
            <Input id="p-dep" inputMode="decimal" value={v.deposit} onChange={(e) => set("deposit", e.target.value)} className="tabular-nums" />
          </Field>
        </div>
      </details>

      {error && <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>{pending ? "Saving…" : product ? "Save changes" : "Add item"}</button>
        <Link href={back} className={buttonClass("secondary", "lg")}>Cancel</Link>
        {product && <button type="button" onClick={archive} disabled={pending} className={buttonClass("danger", "lg", "ml-auto")}>Archive</button>}
      </div>
    </form>
  );
}
