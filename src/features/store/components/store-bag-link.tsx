"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingBag } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { bagCount, useStoreBag } from "./bag-store";

const link =
  "relative inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink";

/** RUXs Store bar: title, my orders and the bag with its item count. */
export function StoreBar() {
  const pathname = usePathname();
  const count = bagCount(useStoreBag());
  const onOrders = pathname.startsWith("/app/kids/shop/orders");
  const onBag = pathname === "/app/kids/shop/bag";

  return (
    <div className="mb-4 flex items-center gap-1">
      <Link
        href="/app/kids/shop"
        className="mr-auto rounded-md font-kids text-lg font-semibold tracking-tight text-kids-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
      >
        RUXs Store
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
        <span aria-hidden="true">Bag</span>
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
