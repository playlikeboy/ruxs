"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, PackageCheck, ShieldCheck } from "lucide-react";
import { formatINR } from "@/core/money";
import { formatAgeBadge } from "@/core/kids";
import { cartActions, useCart } from "@/features/consumer/components/cart-store";
import type { KidsKitItem } from "../types";

export function KidsKitCard({ item }: { item: KidsKitItem }) {
  const [justAdded, setJustAdded] = useState(false);
  const cart = useCart();
  const ageLabel = formatAgeBadge(item.minAge, item.maxAge);

  const existingInCart = cart?.items.find((i) => i.productId === item.productId);

  const handleAddToCart = () => {
    const storeInfo = {
      vendorSlug: item.vendor.slug,
      vendorName: item.vendor.name,
      deliveryFeePaise: 0,
      minOrderPaise: 0,
    };

    const cartItem = {
      productId: item.productId,
      name: item.name,
      unitPricePaise: item.pricePaise,
      isVeg: null,
    };

    // If another store is already in cart, force replace or add
    cartActions.add(storeInfo, cartItem, true);

    setJustAdded(true);
    try {
      navigator.vibrate?.(20);
    } catch {}
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-kids-grape/15 bg-white shadow-[0_5px_0_rgba(155,92,246,0.14),0_12px_24px_-14px_rgba(59,31,92,0.35)] transition hover:translate-y-[-2px]">
      {/* Poster image if provided */}
      {item.posterUrl && (
        <div className="relative h-36 w-full overflow-hidden bg-sky-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.posterUrl} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-kids-ink backdrop-blur-xs shadow-xs">
            👶 {ageLabel}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Top Badges (if no poster) */}
        {!item.posterUrl && (
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border-2 border-kids-grape/15 bg-sky-100 text-2xl shadow-[0_3px_0_rgba(155,92,246,0.18)]">
              {item.emoji}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <span className="inline-flex items-center rounded-full border border-kids-grape/20 bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-kids-ink">
                👶 {ageLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-kids-grape/20 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-950">
                📦 DOORSTEP KIT
              </span>
            </div>
          </div>
        )}

        {/* Title & Description */}
        <div className={item.posterUrl ? "mt-1" : "mt-3"}>
          <h3 className="text-base font-black leading-snug tracking-tight text-kids-ink">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-kids-ink/70">
            {item.description}
          </p>
        </div>

        {/* Child-Safe Badge */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Non-Toxic & Tested Safe for Children</span>
        </div>

        {/* Features / Kit contents checklist */}
        {item.features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.features.map((feat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-kids-ink/80"
              >
                <PackageCheck className="h-3 w-3 text-slate-500" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-kids-ink/80 border-t border-slate-100 pt-2">
          <Link href={`/app/kids/providers/${item.vendor.slug}`} className="hover:text-kids-bubblegum">
            By {item.vendor.name}
          </Link>
          <span className="text-slate-400">·</span>
          <span className="text-[11px] text-kids-ink/60">{item.vendor.area}</span>
        </div>

        {/* Price & Add to Cart action */}
        <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-3">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Kit Price
            </span>
            <span className="text-lg font-black text-kids-ink">
              {formatINR(item.pricePaise)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-kids-grape/15 px-4 py-2 text-xs font-black shadow-[0_3px_0_rgba(155,92,246,0.18)] transition active:translate-y-0.5 active:shadow-none ${
              justAdded
                ? "bg-emerald-400 text-slate-950"
                : existingInCart
                ? "bg-amber-300 text-kids-ink"
                : "bg-kids-bubblegum text-white hover:bg-pink-600"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added!</span>
              </>
            ) : existingInCart ? (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add More ({existingInCart.qty})</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Kit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
