"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: TabItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Marketplace",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/vendors", label: "Vendors", icon: Store },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
      { href: "/admin/households", label: "Households", icon: Users },
    ],
  },
  {
    title: "Finance & Accounts",
    items: [
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/payouts", label: "Payouts & Refunds", icon: Wallet },
    ],
  },
  {
    title: "Platform & Safety",
    items: [
      { href: "/admin/kids", label: "Kids Zone", icon: Sparkles },
      { href: "/admin/tickets", label: "Tickets & Disputes", icon: ShieldAlert },
      { href: "/admin/settings", label: "Platform Settings", icon: Settings },
    ],
  },
];

const ALL_TABS: TabItem[] = NAV_GROUPS.flatMap((g) => g.items);

function useActive() {
  const pathname = usePathname();
  return (t: TabItem) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));
}

/** Desktop: Grouped vertical sidebar with clean Operate-mode hierarchy. */
export function AdminSidebarNav({ badges }: { badges: Record<string, number> }) {
  const isActive = useActive();

  return (
    <nav aria-label="Admin console navigation" className="space-y-6 px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/70">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((t) => {
              const active = isActive(t);
              const Icon = t.icon;
              const badge = badges[t.href] ?? 0;

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex h-9 items-center gap-2.5 rounded-[10px] px-3 text-xs transition-colors " +
                    (active
                      ? "bg-ink font-bold text-white shadow-xs"
                      : "text-muted font-medium hover:bg-bg hover:text-ink")
                  }
                >
                  <Icon
                    className={
                      "h-4 w-4 shrink-0 transition-colors " +
                      (active ? "text-accent" : "text-muted")
                    }
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{t.label}</span>
                  {badge > 0 && (
                    <span
                      className={
                        "flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums " +
                        (active ? "bg-accent text-white" : "bg-accent/15 text-accent")
                      }
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Mobile: Horizontal scrolling tabs. */
export function AdminTabs({ badges }: { badges: Record<string, number> }) {
  const isActive = useActive();

  return (
    <nav
      aria-label="Admin sections"
      className="-mb-px flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]"
    >
      {ALL_TABS.map((t) => {
        const active = isActive(t);
        const badge = badges[t.href] ?? 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1.5 text-xs font-semibold transition " +
              (active
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink")
            }
          >
            {t.label}
            {badge > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white tabular-nums">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
