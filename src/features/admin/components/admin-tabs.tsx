"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/households", label: "Households" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none]">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={"shrink-0 border-b-2 pb-3 text-sm font-semibold transition " + (active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
