"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Store, ShoppingBag, UserRound } from "lucide-react";
import { cartCount, useCart } from "./cart-store";

const STORE = "/app/kids/shop";

const TABS = [
  { href: "/app", label: "Explore", icon: House },
  { href: STORE, label: "Store", icon: Store },
  { href: "/app/cart", label: "Cart", icon: ShoppingBag },
  { href: "/app/account", label: "Account", icon: UserRound },
];

/** Which tab owns a path. Orders, plans and bookings live under Account. */
function activeTab(pathname: string): string {
  if (pathname.startsWith(STORE)) return STORE;
  if (pathname.startsWith("/app/cart")) return "/app/cart";
  if (["/app/account", "/app/orders", "/app/plans", "/app/bookings", "/app/tickets"].some((p) => pathname.startsWith(p))) {
    return "/app/account";
  }
  return "/app";
}

export function TabBar() {
  const pathname = usePathname();
  const count = cartCount(useCart());

  return (
    <nav
      aria-label="App navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-16 grid-cols-4">
        {TABS.map((tab) => {
          const active = activeTab(pathname) === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
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
                {tab.href === "/app/cart" && count > 0 && <span className="sr-only">, {count} {count === 1 ? "item" : "items"}</span>}
                {tab.href === "/app/cart" && count > 0 && (
                  <span aria-hidden="true" className="absolute right-[calc(50%-20px)] top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
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
