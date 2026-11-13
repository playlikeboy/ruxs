"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/components/ui/cn";
import { formatINR } from "@/core/money";
import { formatAgeBadge } from "@/core/kids";
import { cartActions, useCart } from "@/features/consumer/components/cart-store";
import type { KidsKitItem } from "../types";
import { KidsRating } from "./kids-ui";

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
  };

  // Reset the "Added" confirmation; cleared if the card unmounts first.
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(t);
  }, [justAdded]);

  return (
    <article className="group flex gap-3.5 rounded-[20px] border border-kids-ink/10 bg-white p-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:border-kids-ink/25 hover:shadow-[0_4px_16px_rgba(23,71,55,0.06)] motion-reduce:transform-none motion-reduce:transition-none">
      <CoverArt theme="kits" className="h-24 w-24 shrink-0 rounded-[16px] shadow-xs" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="line-clamp-2 font-kids text-base font-semibold leading-snug text-kids-ink">{item.name}</h3>
        <p className="mt-0.5 truncate text-sm text-kids-ink/60">{item.vendor.name} · {item.vendor.area}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-kids-peach/40 px-2.5 py-0.5 text-xs font-semibold text-kids-ink">
            <span aria-hidden="true">🐣</span> {formatAgeBadge(item.minAge, item.maxAge)}
          </span>
          <span className="text-xs">
            <KidsRating rating={item.vendor.rating} reviewCount={item.vendor.reviewCount} />
          </span>
          {item.nonToxicCertified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-kids-mint/70 px-2.5 py-0.5 text-xs font-semibold text-good">
              <span aria-hidden="true">🌿</span> Non-toxic
            </span>
          )}
        </div>
        {item.features.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs text-kids-ink/65"><span aria-hidden="true">📦</span> In the box: {item.features.join(", ")}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <span className="min-w-0 text-base font-extrabold tabular-nums text-kids-ink">{formatINR(item.pricePaise)}</span>
          <button
            type="button"
            onClick={add}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors shadow-xs",
              justAdded ? "bg-good text-white" : "bg-kids-ink text-white hover:bg-kids-ink/90"
            )}
          >
            {justAdded ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
            <span aria-live="polite">{justAdded ? "Added" : inCart ? `Add (${inCart.qty})` : "Add"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
