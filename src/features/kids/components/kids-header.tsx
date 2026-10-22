"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/features/consumer/components/cart-store";
import { ModeSwitch } from "@/features/consumer/components/mode-switch";

export function KidsHeader() {
  const cart = useCart();
  const count = cartCount(cart);

  return (
    <header className="sticky top-0 z-30 bg-kids-cream/90 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <ModeSwitch className="flex-1" />
        <Link
          href="/app/cart"
          aria-label="View cart"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)] ring-1 ring-kids-grape/15 transition active:translate-y-0.5 active:shadow-none"
        >
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.2} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kids-bubblegum px-1 text-[10px] font-bold text-white tabular-nums">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
