"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, PackageCheck } from "lucide-react";
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
    <div className="relative flex flex-col justify-between rounded-3xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_0_#0f172a] transition hover:translate-y-[-1px]">
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-sky-100 text-2xl shadow-[2px_2px_0_0_#0f172a]">
            {item.emoji}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="inline-flex items-center rounded-full border border-slate-900 bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-slate-900">
              👶 {ageLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-900 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-950">
              📦 DOORSTEP KIT
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mt-3">
          <h3 className="text-base font-black leading-snug tracking-tight text-slate-950">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-600">
            {item.description}
          </p>
        </div>

        {/* Highlights */}
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-600">
          {item.features.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              <PackageCheck className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>

        {/* Store */}
        <div className="mt-2 text-xs font-bold text-slate-500">
          <Link href={`/app/store/${item.vendor.slug}`} className="hover:text-accent underline underline-offset-2">
            By {item.vendor.name}
          </Link>
        </div>
      </div>

      {/* Pricing and Cart button */}
      <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-3">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Kit Price</span>
          <span className="text-lg font-black text-slate-950">{formatINR(item.pricePaise)}</span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-black shadow-[2px_2px_0_0_#0f172a] transition active:translate-y-0.5 active:shadow-none ${
            justAdded
              ? "bg-emerald-400 text-slate-950"
              : "bg-sky-400 text-slate-950 hover:bg-sky-300"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>{existingInCart ? `Add More (${existingInCart.qty})` : "Add to Cart"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
