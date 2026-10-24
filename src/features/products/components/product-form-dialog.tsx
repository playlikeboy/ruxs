"use client";

import { AppIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { ServiceKind } from "@/config/service-kinds";

export interface CategoryOption {
  id: string;
  emoji: string;
  shortLabel: string;
}
import { saveProduct } from "@/features/products/actions";

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

/** Sensible form defaults for well-known categories; anything else starts as a morning item. */
const KNOWN_DEFAULTS: Record<string, { shift: Shift; asset: string; cutoff: string }> = {
  tiffin: { shift: "lunch", asset: "dabba", cutoff: "10:00" },
  water: { shift: "morning", asset: "can", cutoff: "08:00" },
  milk: { shift: "morning", asset: "", cutoff: "21:00" },
};
const defaultsFor = (kind: ServiceKind) => KNOWN_DEFAULTS[kind] ?? { shift: "morning" as Shift, asset: "", cutoff: "09:00" };

const input =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";
const label = "mb-1 block text-xs font-medium text-ink";

function Toggle({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label className="border-line flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5">
      <span>
        <span className="text-ink block text-sm font-medium">{title}</span>
        <span className="text-muted block text-xs">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className="bg-line peer-checked:bg-good relative h-6 w-11 shrink-0 rounded-full transition after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
        aria-hidden="true"
      />
    </label>
  );
}

export function ProductFormDialog({
  slug,
  categories,
  product,
  triggerLabel = "+ Add item",
  triggerClassName,
}: {
  slug: string;
  categories: CategoryOption[];
  product?: EditableProduct;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const initialKind = product?.kind ?? categories[0]?.id ?? "tiffin";
  const [kind, setKind] = useState<ServiceKind>(initialKind);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [section, setSection] = useState(product?.section ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [isVeg, setIsVeg] = useState<boolean | null>(
    product?.isVeg ?? (initialKind === "tiffin" ? true : null)
  );
  const [shift, setShift] = useState<Shift>(
    (product?.shift as Shift) ?? defaultsFor(initialKind).shift
  );
  const [price, setPrice] = useState(
    product ? String(product.pricePaise / 100) : ""
  );
  const [deposit, setDeposit] = useState(
    product ? String(product.depositPaise / 100) : "0"
  );
  const [assetName, setAssetName] = useState(
    product?.assetName ?? defaultsFor(initialKind).asset
  );
  const [cutoffAt, setCutoffAt] = useState(
    product?.cutoffAt ?? defaultsFor(initialKind).cutoff
  );
  const [lateRule, setLateRule] = useState<LateRule>(
    (product?.lateRule as LateRule) ?? "full"
  );
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [allowSubscription, setAllowSubscription] = useState(
    product?.allowSubscription ?? true
  );
  const [allowOneTime, setAllowOneTime] = useState(
    product?.allowOneTime ?? true
  );

  function pickKind(k: ServiceKind) {
    setKind(k);
    if (!product) {
      setShift(defaultsFor(k).shift);
      setAssetName(defaultsFor(k).asset);
      setCutoffAt(defaultsFor(k).cutoff);
      setIsVeg(k === "tiffin" ? true : null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceRupees = Number(price);
    const depositRupees = Number(deposit || "0");
    if (!Number.isFinite(priceRupees) || priceRupees <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    startTransition(async () => {
      const res = await saveProduct({
        slug,
        id: product?.id,
        kind,
        name,
        description,
        section,
        imageUrl,
        isVeg,
        shift,
        priceRupees,
        depositRupees: Number.isFinite(depositRupees) ? depositRupees : 0,
        assetName,
        cutoffAt,
        lateRule,
        isAvailable,
        allowSubscription,
        allowOneTime,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Could not save");
        return;
      }
      toast.success(product ? "Item updated" : "Item added to your menu");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "bg-accent shrink-0 rounded-[10px] px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition active:scale-95"
        }
      >
        {triggerLabel}
      </button>

      {open &&
        createPortal(
          <div
            className="bg-ink/40 fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-title"
          >
            <div className="bg-surface max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[20px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg sm:rounded-[16px]">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    id="menu-item-title"
                    className="text-ink text-lg font-semibold"
                  >
                    {product ? "Edit item" : "New menu item"}
                  </h3>
                  <p className="text-muted text-xs">
                    Shown to households on your RUXs store page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-muted hover:bg-bg hover:text-ink rounded-full p-1.5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submit} className="mt-4 space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => pickKind(k.id)}
                      aria-pressed={kind === k.id}
                      className={
                        "flex flex-col items-center gap-1 rounded-[10px] border py-2 text-[11px] font-semibold transition " +
                        (kind === k.id
                          ? "border-accent bg-peach text-accent"
                          : "border-line text-muted")
                      }
                    >
                      <AppIcon name={k.id} className="h-5 w-5" />
                      {k.shortLabel}
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="mi-name" className={label}>
                    Name
                  </label>
                  <input
                    id="mi-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      kind === "water"
                        ? "20L Mineral Water Can"
                        : "Veg Lunch Thali"
                    }
                    className={input}
                  />
                </div>
                <div>
                  <label htmlFor="mi-desc" className={label}>
                    Description
                  </label>
                  <textarea
                    id="mi-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={300}
                    placeholder="3 rotis, dal, sabzi, rice, salad"
                    className={input}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mi-price" className={label}>
                      Price (₹)
                    </label>
                    <input
                      id="mi-price"
                      required
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="90"
                      className={input + " tabular-nums"}
                    />
                  </div>
                  <div>
                    <label htmlFor="mi-section" className={label}>
                      Menu section
                    </label>
                    <input
                      id="mi-section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="Thalis"
                      className={input}
                    />
                  </div>
                </div>

                {(kind === "tiffin" || kind === "other") && (
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label="Food type"
                  >
                    {[
                      { v: true, t: "Veg" },
                      { v: false, t: "Non-veg" },
                      { v: null, t: "Not food" },
                    ].map((o) => (
                      <button
                        key={o.t}
                        type="button"
                        role="radio"
                        aria-checked={isVeg === o.v}
                        onClick={() => setIsVeg(o.v)}
                        className={
                          "rounded-[10px] border py-2 text-xs font-semibold " +
                          (isVeg === o.v
                            ? "border-ink bg-ink text-white"
                            : "border-line text-muted")
                        }
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label htmlFor="mi-img" className={label}>
                    Photo link (optional)
                  </label>
                  <input
                    id="mi-img"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    className={input}
                  />
                </div>

                <div className="space-y-2">
                  <Toggle
                    checked={isAvailable}
                    onChange={setIsAvailable}
                    title="Available"
                    hint="Turn off when sold out for the day"
                  />
                  <Toggle
                    checked={allowOneTime}
                    onChange={setAllowOneTime}
                    title="One-time orders"
                    hint="Households can add it to a cart"
                  />
                  <Toggle
                    checked={allowSubscription}
                    onChange={setAllowSubscription}
                    title="Subscriptions"
                    hint="Households can get it on chosen days"
                  />
                </div>

                <fieldset className="bg-bg space-y-3 rounded-[12px] p-3">
                  <legend className="text-muted px-1 text-xs font-semibold tracking-wide uppercase">
                    Delivery rules
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="mi-shift" className={label}>
                        Shift
                      </label>
                      <select
                        id="mi-shift"
                        value={shift}
                        onChange={(e) => setShift(e.target.value as Shift)}
                        className={input + " capitalize"}
                      >
                        <option value="morning">Morning</option>
                        <option value="lunch">Lunch</option>
                        <option value="evening">Evening</option>
                        <option value="dinner">Dinner</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="mi-cutoff" className={label}>
                        Daily cutoff (IST)
                      </label>
                      <input
                        id="mi-cutoff"
                        type="time"
                        required
                        value={cutoffAt}
                        onChange={(e) => setCutoffAt(e.target.value)}
                        className={input + " font-mono"}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="mi-late" className={label}>
                      Skip after cutoff
                    </label>
                    <select
                      id="mi-late"
                      value={lateRule}
                      onChange={(e) => setLateRule(e.target.value as LateRule)}
                      className={input}
                    >
                      <option value="free">Free — no charge</option>
                      <option value="half">Half charge</option>
                      <option value="full">Full charge</option>
                      <option value="locked">Not allowed</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="mi-asset" className={label}>
                        Returnable
                      </label>
                      <input
                        id="mi-asset"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        placeholder="can, dabba"
                        className={input}
                      />
                    </div>
                    <div>
                      <label htmlFor="mi-dep" className={label}>
                        Deposit (₹)
                      </label>
                      <input
                        id="mi-dep"
                        inputMode="decimal"
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                        className={input + " tabular-nums"}
                      />
                    </div>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={pending}
                  className="bg-accent w-full rounded-[12px] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {pending
                    ? "Saving…"
                    : product
                      ? "Save changes"
                      : "Add to menu"}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
