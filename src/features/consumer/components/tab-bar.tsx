"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarCheck, ShoppingBag, ReceiptIndianRupee, UserRound } from "lucide-react";
import { cartCount, useCart } from "./cart-store";

const TABS = [
  { href: "/app", label: "Explore", icon: House, exact: true },
  { href: "/app/plans", label: "Plans", icon: CalendarCheck },
  { href: "/app/cart", label: "Cart", icon: ShoppingBag },
  { href: "/app/orders", label: "Orders", icon: ReceiptIndianRupee },
  { href: "/app/account", label: "Account", icon: UserRound },
];

export function TabBar() {
  const pathname = usePathname();
  const count = cartCount(useCart());

  return (
    <nav
      aria-label="App navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href || pathname.startsWith("/app/category") || pathname.startsWith("/app/search") || pathname.startsWith("/app/store")
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors " +
                  (active ? "text-accent" : "text-neutral-500 hover:text-ink")
                }
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
                {tab.label}
                {tab.href === "/app/cart" && count > 0 && (
                  <span className="absolute right-[calc(50%-20px)] top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
