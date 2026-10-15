"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatINR } from "@/core/money";
import { cartCount, cartSubtotal, useCart } from "./cart-store";

export function ViewCartBar({ onlyFor }: { onlyFor?: string }) {
  const cart = useCart();
  if (!cart || (onlyFor && cart.vendorSlug !== onlyFor)) return null;
  const count = cartCount(cart);

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md px-4 pb-3">
      <Link
        href="/app/cart"
        className="flex h-14 items-center justify-between rounded-2xl bg-accent px-4 text-white shadow-[0_10px_30px_rgba(189,75,42,0.35)] transition active:scale-[0.98]"
      >
        <span className="flex flex-col leading-tight">
          <span className="text-[13px] font-bold tabular-nums">
            {count} {count === 1 ? "item" : "items"} · {formatINR(cartSubtotal(cart))}
          </span>
          <span className="text-[11px] opacity-90">from {cart.vendorName}</span>
        </span>
        <span className="flex items-center gap-2 text-[15px] font-bold">
          View cart <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
