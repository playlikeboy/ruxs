"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { bagCount, useStoreBag } from "./bag-store";

const link =
  "relative inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink";

/** RUXs Store bar: title, my wishlist, my orders and the bag with its item count. */
export function StoreBar() {
  const pathname = usePathname();
  const count = bagCount(useStoreBag());
  const onOrders = pathname.startsWith("/app/kids/shop/orders");
  const onBag = pathname === "/app/kids/shop/bag";
  const onWishlist = pathname === "/app/kids/shop/wishlist";

  return (
    <div className="mb-4 flex items-center gap-1">
      <Link
        href="/app/kids/shop"
        className="mr-auto whitespace-nowrap rounded-md font-kids text-lg font-semibold tracking-tight text-kids-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
      >
        RUXs Store
      </Link>
      <Link
        href="/app/kids/shop/wishlist"
        aria-current={onWishlist ? "page" : undefined}
        aria-label="Wishlist"
        className={cn(link, "w-10 justify-center px-0", onWishlist ? "bg-white text-kids-ink shadow-xs" : "text-kids-ink/70 hover:bg-kids-ink/5 hover:text-kids-ink")}
      >
        <Heart className={cn("h-4 w-4", onWishlist && "fill-accent text-accent")} aria-hidden="true" />
      </Link>
      <Link
        href="/app/kids/shop/orders"
        aria-current={onOrders ? "page" : undefined}
        className={cn(link, onOrders ? "bg-white text-kids-ink shadow-xs" : "text-kids-ink/70 hover:bg-kids-ink/5 hover:text-kids-ink")}
      >
        <Package className="h-4 w-4" aria-hidden="true" /> Orders
      </Link>
      <Link
        href="/app/kids/shop/bag"
        aria-current={onBag ? "page" : undefined}
        aria-label={count ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag, empty"}
        className={cn(link, onBag ? "bg-white text-kids-ink shadow-xs" : "text-kids-ink/70 hover:bg-kids-ink/5 hover:text-kids-ink")}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        {/* The word is dropped on the narrowest phones so the bar never wraps; the link keeps its aria-label. */}
        <span aria-hidden="true" className="hidden min-[400px]:inline">
          Bag
        </span>
        {count > 0 && (
          <span
            aria-hidden="true"
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold tabular-nums text-white"
          >
            {count}
          </span>
        )}
      </Link>
    </div>
  );
}
