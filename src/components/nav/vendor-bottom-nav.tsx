"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutGrid, Repeat, UtensilsCrossed } from "lucide-react";

export function VendorBottomNav({ slug, newOrders = 0 }: { slug: string; newOrders?: number }) {
  const pathname = usePathname();
  const base = "/merchant-panel/" + slug;

  const navItems = [
    { label: "Today", href: base + "/today", icon: CalendarDays },
    { label: "Orders", href: base + "/orders", icon: ClipboardList, badge: newOrders },
    { label: "Plans", href: base + "/subscriptions", icon: Repeat },
    { label: "Menu", href: base + "/products", icon: UtensilsCrossed },
    { label: "More", href: base + "/more", icon: LayoutGrid },
  ];

  return (
    <nav aria-label="Merchant navigation" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={"relative flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors " + (isActive ? "font-semibold text-accent" : "text-muted hover:text-ink")}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden="true" />
                {item.label}
                {item.badge ? (
                  <span className="absolute right-[calc(50%-20px)] top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
