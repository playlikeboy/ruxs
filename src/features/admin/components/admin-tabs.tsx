"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardList, LayoutDashboard, Settings, ShieldAlert, Sparkles, Store, Users, Wallet, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/kids", label: "Kids Zone", icon: Sparkles },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/tickets", label: "Tickets & Disputes", icon: ShieldAlert },
  { href: "/admin/households", label: "Households", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function useActive() {
  const pathname = usePathname();
  return (t: (typeof TABS)[number]) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));
}

/** Desktop: vertical sidebar list. */
export function AdminSidebarNav({ badges }: { badges: Record<string, number> }) {
  const isActive = useActive();
  return (
    <nav aria-label="Admin sections" className="space-y-0.5 px-3 py-4">
      {TABS.map((t) => {
        const active = isActive(t);
        const Icon = t.icon;
        const badge = badges[t.href] ?? 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={"flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors " + (active ? "bg-ink font-semibold text-white" : "text-ink hover:bg-bg")}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
            <span className="flex-1">{t.label}</span>
            {badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white tabular-nums">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile: horizontal scrolling tabs under the top bar. */
export function AdminTabs({ badges }: { badges: Record<string, number> }) {
  const isActive = useActive();
  return (
    <nav aria-label="Admin sections" className="-mb-px flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]">
      {TABS.map((t) => {
        const active = isActive(t);
        const badge = badges[t.href] ?? 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={"flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 pb-3 pt-1 text-sm font-semibold transition " + (active ? "border-ink text-ink" : "border-transparent text-muted")}
          >
            {t.label}
            {badge > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white tabular-nums">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
