"use client";

import { useState } from "react";
import { Check, Plus, Star } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/components/ui/cn";
import { formatINR } from "@/core/money";
import { formatAgeBadge } from "@/core/kids";
import { cartActions, useCart } from "@/features/consumer/components/cart-store";
import type { KidsKitItem } from "../types";

/** A learning kit delivered home, added straight to the cart. */
export function KidsKitCard({ item }: { item: KidsKitItem }) {
  const [justAdded, setJustAdded] = useState(false);
  const inCart = useCart()?.items.find((i) => i.productId === item.productId);

  const add = () => {
    cartActions.add(
      { vendorSlug: item.vendor.slug, vendorName: item.vendor.name, deliveryFeePaise: 0, minOrderPaise: 0 },
      { productId: item.productId, name: item.name, unitPricePaise: item.pricePaise, isVeg: null },
      true
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <article className="group flex gap-3.5 rounded-[20px] border border-kids-ink/10 bg-white p-3.5 transition-all duration-200 hover:border-kids-ink/25 hover:shadow-[0_4px_16px_rgba(23,71,55,0.06)] hover:-translate-y-0.5">
      <CoverArt theme="kits" className="h-24 w-24 shrink-0 rounded-[16px] shadow-xs" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="line-clamp-2 font-kids text-base font-semibold leading-snug text-kids-ink">{item.name}</h3>
        <p className="mt-0.5 truncate text-sm text-kids-ink/60">{item.vendor.name} · {item.vendor.area}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-peach/40 px-2.5 py-0.5 text-xs font-semibold text-kids-ink">
            🐣 {formatAgeBadge(item.minAge, item.maxAge)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200/60">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {item.vendor.rating > 0 ? item.vendor.rating.toFixed(1) : "5.0"}
          </span>
          {item.nonToxicCertified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-kids-mint/70 px-2.5 py-0.5 text-xs font-semibold text-good">
              🌿 Non-toxic
            </span>
          )}
        </div>
        {item.features.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs text-kids-ink/65">📦 In the box: {item.features.join(", ")}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <span className="whitespace-nowrap text-base font-extrabold tabular-nums text-kids-ink">{formatINR(item.pricePaise)}</span>
          <button
            type="button"
            onClick={add}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all active:scale-95 shadow-xs",
              justAdded ? "bg-good text-white" : "bg-kids-ink text-white hover:bg-kids-ink/90"
            )}
          >
            {justAdded ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
            {justAdded ? "Added!" : inCart ? `Add (${inCart.qty})` : "Add to box"}
          </button>
        </div>
      </div>
    </article>
  );
}
