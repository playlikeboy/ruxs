"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  ExternalLink,
  FileText,
  Navigation,
  Package,
  Repeat,
  Settings,
  Star,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Role = "owner" | "staff" | "driver";

interface Item {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: Role[];
  badge?: number;
}

/** Desktop navigation for the merchant panel. Mobile uses the bottom tab bar. */
export function VendorSidebar({
  slug,
  storeName,
  area,
  role,
  acceptingOrders,
  newOrders,
}: {
  slug: string;
  storeName: string;
  area: string;
  role: Role;
  acceptingOrders: boolean;
  newOrders: number;
}) {
  const pathname = usePathname();
  const base = "/merchant-panel/" + slug;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Daily",
      items: [
        { label: "Today", path: "/today", icon: CalendarDays },
        { label: "Orders", path: "/orders", icon: ClipboardList, badge: newOrders },
        { label: "Delivery run", path: "/run", icon: Navigation },
        { label: "Plans", path: "/subscriptions", icon: Repeat, roles: ["owner", "staff"] },
      ],
    },
    {
      title: "Store",
      items: [
        { label: "Menu", path: "/products", icon: UtensilsCrossed },
        { label: "Inventory", path: "/inventory", icon: Package },
        { label: "Customers", path: "/customers", icon: Users, roles: ["owner", "staff"] },
        { label: "Reviews", path: "/reviews", icon: Star, roles: ["owner", "staff"] },
      ],
    },
    {
      title: "Money",
      items: [
        { label: "Earnings", path: "/earnings", icon: Wallet, roles: ["owner", "staff"] },
        { label: "Bills", path: "/bills", icon: FileText, roles: ["owner", "staff"] },
        { label: "Analytics", path: "/analytics", icon: ChartColumn, roles: ["owner", "staff"] },
      ],
    },
    {
      title: "Settings",
      items: [{ label: "Store settings", path: "/settings", icon: Settings, roles: ["owner"] }],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-ink text-base font-bold text-white" aria-hidden="true">
          {storeName.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{storeName}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted">
            <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (acceptingOrders ? "bg-good" : "bg-bad")} aria-hidden="true" />
            {acceptingOrders ? "Taking orders" : "Paused"} · {area}
          </p>
        </div>
      </div>

      <nav aria-label="Merchant navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => {
          const items = g.items.filter((i) => !i.roles || i.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={g.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.title}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const href = base + item.path;
                  const active = pathname.startsWith(href);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={
                          "flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors " +
                          (active ? "bg-peach font-semibold text-accent" : "text-ink hover:bg-bg")
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white tabular-nums">{item.badge}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link href={"/app/store/" + slug} className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm text-muted hover:bg-bg hover:text-ink">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View store page
        </Link>
      </div>
    </aside>
  );
}
