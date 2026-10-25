"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ShoppingBag, UsersRound } from "lucide-react";
import { cartCount, useCart } from "@/features/consumer/components/cart-store";

const iconLink =
  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-kids-ink transition-colors hover:bg-kids-ink/5 active:bg-kids-ink/10";

/** Back to the main app, the Kids title, and the family shortcuts. */
export function KidsHeader() {
  const count = cartCount(useCart());

  return (
    <header className="sticky top-0 z-30 border-b border-kids-ink/10 bg-kids-cream/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-1">
        <Link href="/app" aria-label="Back to RUXs home" className={iconLink}>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link href="/app/kids" className="mr-auto font-kids text-xl font-semibold tracking-tight">
          RUXs Kids
        </Link>
        <Link href="/app/kids/bookings" aria-label="My bookings" className={iconLink}>
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link href="/app/kids/children" aria-label="My children" className={iconLink}>
          <UsersRound className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link href="/app/cart" aria-label={count ? `Cart, ${count} items` : "Cart"} className={iconLink}>
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold tabular-nums text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
