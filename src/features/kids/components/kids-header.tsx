"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/features/consumer/components/cart-store";

export function KidsHeader() {
  const cart = useCart();
  const count = cartCount(cart);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-amber-900/10 bg-white/95 px-4 py-3 backdrop-blur-md">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900/15 bg-amber-50 px-3 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_0_rgba(15,23,42,0.1)] transition active:translate-y-0.5 active:shadow-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span>Main App</span>
      </Link>

      <div className="flex items-center gap-1.5">
        <span className="text-xl" aria-hidden="true">🎈</span>
        <span className="text-sm font-extrabold tracking-tight text-ink">Kids Zone</span>
      </div>

      <Link
        href="/app/cart"
        aria-label="View Cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900/15 bg-sky-50 text-ink shadow-[2px_2px_0_0_rgba(15,23,42,0.1)] transition active:translate-y-0.5 active:shadow-none"
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={2.2} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-white tabular-nums">
            {count}
          </span>
        )}
      </Link>
    </header>
  );
}
