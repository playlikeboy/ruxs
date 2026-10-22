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
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href ||
              pathname.startsWith("/app/category") ||
              pathname.startsWith("/app/search") ||
              pathname.startsWith("/app/store") ||
              pathname.startsWith("/app/kids")
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                onClick={() => {
                  try {
                    navigator.vibrate?.(10);
                  } catch {}
                }}
                className={
                  "relative flex h-full min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:scale-[0.98] " +
                  (active ? "text-brand-deep" : "text-muted hover:text-ink")
                }
              >
                <span className={"flex h-8 w-10 items-center justify-center rounded-xl transition-colors " + (active ? "bg-brand-peach text-accent" : "text-muted")}>
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
                </span>
                <span>{tab.label}</span>
                {tab.href === "/app/cart" && count > 0 && (
                  <span className="absolute right-[calc(50%-20px)] top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
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
