"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  History,
  LayoutDashboard,
  LayoutList,
  MapPinned,
  Package,
  PackageCheck,
  SlidersHorizontal,
  Star,
  Tags,
  TicketPercent,
  Truck,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Selling",
    items: [
      { href: "/seller-portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/seller-portal/orders", label: "Orders", icon: PackageCheck },
      { href: "/seller-portal/returns", label: "Returns", icon: Undo2 },
      { href: "/seller-portal/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/seller-portal/products", label: "Products", icon: Package },
      { href: "/seller-portal/inventory", label: "Inventory", icon: Boxes },
      { href: "/seller-portal/categories", label: "Categories", icon: Tags },
      { href: "/seller-portal/collections", label: "Collections", icon: LayoutList },
      { href: "/seller-portal/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Offers and delivery",
    items: [
      { href: "/seller-portal/coupons", label: "Coupons", icon: TicketPercent },
      { href: "/seller-portal/shipping", label: "Shipping zones", icon: MapPinned },
      { href: "/seller-portal/partners", label: "Partners", icon: Truck },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/seller-portal/audit", label: "Audit log", icon: History },
      { href: "/seller-portal/settings", label: "Settings", icon: SlidersHorizontal },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function useActive() {
  const pathname = usePathname();
  return (t: NavItem) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`));
}

/** Desktop: grouped sidebar. Badges count work waiting in that section. */
export function SellerSidebarNav({ badges }: { badges: Record<string, number> }) {
  const isActive = useActive();
  return (
    <nav aria-label="Seller portal" className="space-y-5 px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((t) => {
              const active = isActive(t);
              const Icon = t.icon;
              const badge = badges[t.href] ?? 0;
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                      (active ? "bg-brand-deep font-semibold text-white" : "font-medium text-ink/80 hover:bg-bg hover:text-ink")
                    }
                  >
                    <Icon className={"h-4 w-4 shrink-0 " + (active ? "text-white" : "text-muted")} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    <span className="flex-1 truncate">{t.label}</span>
                    {badge > 0 && (
                      <span
                        className={
                          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums " +
                          (active ? "bg-white text-brand-deep" : "bg-peach text-accent")
                        }
                      >
                        {badge}
                        <span className="sr-only"> waiting</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Phone and tablet: one horizontally scrolling row of sections. */
export function SellerTabs({ badges }: { badges: Record<string, number> }) {
  const isActive = useActive();
  return (
    <nav aria-label="Seller portal sections" className="-mb-px flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]">
      {ALL_ITEMS.map((t) => {
        const active = isActive(t);
        const badge = badges[t.href] ?? 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent " +
              (active ? "border-brand-deep text-brand-deep" : "border-transparent text-muted hover:text-ink")
            }
          >
            {t.label}
            {badge > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold tabular-nums text-white">
                {badge}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
