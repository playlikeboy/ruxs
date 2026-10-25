"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/components/ui/cn";
import { formatINR } from "@/core/money";
import { formatAgeBadge } from "@/core/kids";
import { cartActions, useCart } from "@/features/consumer/components/cart-store";
import { KidsTag } from "./kids-ui";
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
    <article className="group flex gap-3.5 rounded-[20px] border border-kids-ink/10 bg-white p-3 transition-colors hover:border-kids-ink/25">
      <CoverArt theme="kits" className="h-24 w-24 shrink-0 rounded-[14px]" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">{item.name}</h3>
        <p className="mt-0.5 truncate text-sm text-kids-ink/60">{item.vendor.name} · {item.vendor.area}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <KidsTag>{formatAgeBadge(item.minAge, item.maxAge)}</KidsTag>
          {item.nonToxicCertified && <KidsTag tone="good">Non-toxic (maker&apos;s label)</KidsTag>}
        </div>
        {item.features.length > 0 && (
          <p className="mt-2 line-clamp-1 text-[13px] text-kids-ink/65">In the box: {item.features.join(", ")}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="whitespace-nowrap text-base font-bold tabular-nums">{formatINR(item.pricePaise)}</span>
          <button
            type="button"
            onClick={add}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors active:scale-[0.97]",
              justAdded ? "bg-good text-white" : "bg-kids-ink text-white hover:bg-kids-ink/90"
            )}
          >
            {justAdded ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {justAdded ? "Added" : inCart ? `Add another (${inCart.qty})` : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}
