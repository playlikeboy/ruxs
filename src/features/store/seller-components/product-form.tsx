"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { rupeesToPaise } from "@/core/money";
import { STORE_MAX_IMAGES, storeSlug } from "@/core/store";
import { saveStoreProduct } from "../actions";
import type { AdminStoreProduct } from "../types";
import { ErrorNote } from "./seller-ui";
import { paiseToInput } from "./store-labels";

interface Draft {
  name: string;
  slug: string;
  categoryId: string;
  sku: string;
  brand: string;
  tagline: string;
  description: string;
  price: string; // rupees
  mrp: string; // rupees, blank = none
  gstPercent: string;
  initialStock: string;
  lowStockAt: string;
  ageMin: string;
  ageMax: string; // blank = no upper limit
  skills: string; // comma separated
  boxContents: string; // one per line
  safetyNotes: string;
  images: string[];
  weightGrams: string;
  isFeatured: boolean;
  isActive: boolean;
}

const GST_OPTIONS = ["0", "5", "12", "18", "28"];

/** `copy` starts a new product from an existing one: same details, but its own name, SKU, web address and stock. */
function fromProduct(p: AdminStoreProduct | null, defaultCategory: string, copy = false): Draft {
  return {
    name: p ? (copy ? `${p.name} (copy)`.slice(0, 120) : p.name) : "",
    slug: copy ? "" : (p?.slug ?? ""),
    categoryId: p?.categoryId ?? defaultCategory,
    sku: copy ? "" : (p?.sku ?? ""),
    brand: p?.brand ?? "",
    tagline: p?.tagline ?? "",
    description: p?.description ?? "",
    price: paiseToInput(p?.pricePaise),
    mrp: paiseToInput(p?.mrpPaise),
    gstPercent: String((p?.gstBps ?? 1800) / 100),
    initialStock: "0",
    lowStockAt: String(p?.lowStockAt ?? 5),
    ageMin: String(p?.ageMin ?? 3),
    ageMax: p?.ageMax == null ? "" : String(p.ageMax),
    skills: (p?.skills ?? []).join(", "),
    boxContents: (p?.boxContents ?? []).join("\n"),
    safetyNotes: p?.safetyNotes ?? "",
    images: p?.images ?? [],
    weightGrams: p?.weightGrams == null ? "" : String(p.weightGrams),
    isFeatured: copy ? false : (p?.isFeatured ?? false),
    isActive: copy ? false : (p?.isActive ?? false),
  };
}

const int = (v: string) => (v.trim() === "" ? NaN : Number(v));

/** Create (product = null) or edit a store product. Prices are typed in rupees and sent as integer paise. */
export function StoreProductForm({
  product,
  copyFrom = null,
  categories,
}: {
  product: AdminStoreProduct | null;
  /** New product only: prefill from this one. */
  copyFrom?: AdminStoreProduct | null;
  categories: { id: string; name: string; isActive: boolean }[];
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => fromProduct(product ?? copyFrom, categories.find((c) => c.isActive)?.id ?? "", !product && !!copyFrom));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const isNew = !product;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pricePaise = rupeesToPaise(d.price);
    if (pricePaise <= 0) return setError("Enter a price above ₹0");
    const payload = {
      id: product?.id,
      name: d.name,
      slug: d.slug,
      categoryId: d.categoryId,
      sku: d.sku,
      brand: d.brand,
      tagline: d.tagline,
      description: d.description,
      pricePaise,
      mrpPaise: d.mrp.trim() ? rupeesToPaise(d.mrp) : null,
      gstBps: Math.round(Number(d.gstPercent) * 100),
      lowStockAt: Number(d.lowStockAt || 0),
      ageMin: Number(d.ageMin || 0),
      ageMax: d.ageMax.trim() ? int(d.ageMax) : null,
      skills: d.skills.split(",").map((s) => s.trim()).filter(Boolean),
      boxContents: d.boxContents.split("\n").map((s) => s.trim()).filter(Boolean),
      safetyNotes: d.safetyNotes,
      images: d.images,
      weightGrams: d.weightGrams.trim() ? int(d.weightGrams) : null,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      ...(isNew ? { initialStock: int(d.initialStock) || 0 } : {}),
    };
    start(async () => {
      const res = await saveStoreProduct(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(isNew ? "Product added" : "Product saved");
      if (isNew) router.push(`/seller-portal/products/${res.id}`);
      else {
        set("slug", res.slug);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-ink">Basics</legend>
        <Field label="Name" htmlFor="sp-name">
          <Input id="sp-name" required minLength={3} maxLength={120} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Line-follower robot kit" />
        </Field>
        <Field label="One-line tagline" htmlFor="sp-tag" hint="Shown under the name on product cards.">
          <Input id="sp-tag" maxLength={140} value={d.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="sp-cat">
            <Select id="sp-cat" required value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="" disabled>Pick a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive ? "" : " (hidden)"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Brand" htmlFor="sp-brand" hint="Optional.">
            <Input id="sp-brand" maxLength={80} value={d.brand} onChange={(e) => set("brand", e.target.value)} />
          </Field>
          <Field label="SKU" htmlFor="sp-sku" hint="Letters, numbers, - and _. Must be unique.">
            <Input id="sp-sku" required maxLength={40} autoCapitalize="characters" value={d.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="RS-ROBO-001" />
          </Field>
          <Field
            label="Web address"
            htmlFor="sp-slug"
            hint={`Short, lowercase words joined by dashes help search. Page: /app/kids/shop/p/${d.slug || storeSlug(d.name) || "…"}`}
          >
            <Input
              id="sp-slug"
              maxLength={80}
              autoCapitalize="none"
              spellCheck={false}
              value={d.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
              placeholder={storeSlug(d.name) || "line-follower-robot-kit"}
            />
          </Field>
        </div>
        <Field label="Description" htmlFor="sp-desc">
          <Textarea id="sp-desc" rows={5} maxLength={5000} value={d.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="sr-only">Photos</legend>
        <MultiImageUpload
          label="Photos"
          hint="First photo is the cover. Square works best."
          values={d.images}
          max={STORE_MAX_IMAGES}
          onChange={(urls) => set("images", urls)}
        />
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="text-base font-semibold text-ink">Price</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (₹)" htmlFor="sp-price" hint="What the household pays, GST included.">
            <Input id="sp-price" required inputMode="decimal" type="number" min={1} step="0.01" value={d.price} onChange={(e) => set("price", e.target.value)} className="tabular-nums" />
          </Field>
          <Field label="MRP (₹)" htmlFor="sp-mrp" hint="Optional. Shown struck through when higher.">
            <Input id="sp-mrp" inputMode="decimal" type="number" min={1} step="0.01" value={d.mrp} onChange={(e) => set("mrp", e.target.value)} className="tabular-nums" />
          </Field>
          <Field label="GST rate" htmlFor="sp-gst">
            <Select id="sp-gst" value={d.gstPercent} onChange={(e) => set("gstPercent", e.target.value)}>
              {GST_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="text-base font-semibold text-ink">Stock</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {isNew && (
            <Field label="Opening stock" htmlFor="sp-stock" hint="Later changes go through Adjust stock.">
              <Input id="sp-stock" inputMode="numeric" type="number" min={0} step={1} value={d.initialStock} onChange={(e) => set("initialStock", e.target.value)} className="tabular-nums" />
            </Field>
          )}
          <Field label="Low-stock alert at" htmlFor="sp-low">
            <Input id="sp-low" inputMode="numeric" type="number" min={0} step={1} value={d.lowStockAt} onChange={(e) => set("lowStockAt", e.target.value)} className="tabular-nums" />
          </Field>
          <Field label="Weight (grams)" htmlFor="sp-weight" hint="Optional. Helps the delivery partner.">
            <Input id="sp-weight" inputMode="numeric" type="number" min={1} step={1} value={d.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} className="tabular-nums" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="text-base font-semibold text-ink">For kids</legend>
        <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
          <Field label="Min age" htmlFor="sp-amin">
            <Input id="sp-amin" inputMode="numeric" type="number" min={0} max={18} step={1} value={d.ageMin} onChange={(e) => set("ageMin", e.target.value)} className="tabular-nums" />
          </Field>
          <Field label="Max age" htmlFor="sp-amax" hint="Blank = no upper limit.">
            <Input id="sp-amax" inputMode="numeric" type="number" min={0} max={18} step={1} value={d.ageMax} onChange={(e) => set("ageMax", e.target.value)} className="tabular-nums" />
          </Field>
        </div>
        <Field label="Skills" htmlFor="sp-skills" hint="Comma separated, up to 12. e.g. STEM, Motor skills, Creativity">
          <Input id="sp-skills" value={d.skills} onChange={(e) => set("skills", e.target.value)} />
        </Field>
        <Field label="What's in the box" htmlFor="sp-box" hint="One item per line.">
          <Textarea id="sp-box" rows={4} value={d.boxContents} onChange={(e) => set("boxContents", e.target.value)} />
        </Field>
        <Field label="Safety notes" htmlFor="sp-safety" hint="Choking hazards, adult supervision, battery warnings.">
          <Textarea id="sp-safety" rows={3} maxLength={1000} value={d.safetyNotes} onChange={(e) => set("safetyNotes", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 border-t border-line pt-5 sm:max-w-md">
        <legend className="text-base font-semibold text-ink">Visibility</legend>
        <Toggle id="sp-active" label="Live in the store" checked={d.isActive} onChange={(v) => set("isActive", v)} />
        <Toggle id="sp-featured" label="Feature on the store home" checked={d.isFeatured} onChange={(v) => set("isFeatured", v)} />
      </fieldset>

      <ErrorNote>{error}</ErrorNote>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "lg")}>
          {pending ? "Saving…" : isNew ? "Add product" : "Save changes"}
        </button>
        <button type="button" disabled={pending} onClick={() => router.push("/seller-portal/products")} className={buttonClass("secondary", "lg")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
