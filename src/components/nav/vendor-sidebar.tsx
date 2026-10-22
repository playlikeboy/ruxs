"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { VENDOR_TYPE_INFO, type VendorType } from "@/core/vendor-types";
import { vendorNav, type Role } from "./vendor-nav-items";
import { MODULE_ICON } from "./vendor-icons";

/** Desktop navigation for the merchant panel. Mobile uses the bottom tab bar. */
export function VendorSidebar({
  slug,
  storeName,
  area,
  role,
  acceptingOrders,
  newOrders,
  vendorType,
}: {
  slug: string;
  storeName: string;
  area: string;
  role: Role;
  acceptingOrders: boolean;
  newOrders: number;
  vendorType: VendorType;
}) {
  const pathname = usePathname();
  const base = "/merchant-panel/" + slug;
  const info = VENDOR_TYPE_INFO[vendorType];
  const groups = vendorNav(vendorType, role);
  const publicHref = vendorType === "kids" ? "/app/kids/providers/" + slug : "/app/store/" + slug;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-bg text-xl ring-1 ring-line" aria-hidden="true">
          {info.emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{storeName}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted">
            <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (acceptingOrders ? "bg-good" : "bg-bad")} aria-hidden="true" />
            {info.label} · {area}
          </p>
        </div>
      </div>

      <nav aria-label="Merchant navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const href = base + "/" + item.module;
                const active = pathname.startsWith(href);
                const Icon = MODULE_ICON[item.module];
                const badge = item.module === "orders" ? newOrders : 0;
                return (
                  <li key={item.module}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={
                        "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-all " +
                        (active ? "bg-peach/90 font-semibold text-accent shadow-2xs" : "text-neutral-700 hover:bg-neutral-100/70 hover:text-ink")
                      }
                    >
                      <Icon className={"h-[18px] w-[18px] shrink-0 " + (active ? "text-accent" : "text-neutral-400 group-hover:text-ink")} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white tabular-nums shadow-2xs">{badge}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <Link href={publicHref} className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm text-muted hover:bg-bg hover:text-ink">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View public page
        </Link>
      </div>
    </aside>
  );
}
