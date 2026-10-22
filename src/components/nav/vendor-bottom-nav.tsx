"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VendorType } from "@/core/vendor-types";
import { vendorTabs } from "./vendor-nav-items";
import { MODULE_ICON } from "./vendor-icons";

export function VendorBottomNav({ slug, newOrders = 0, vendorType }: { slug: string; newOrders?: number; vendorType: VendorType }) {
  const pathname = usePathname();
  const base = "/merchant-panel/" + slug;
  const tabs = [...vendorTabs(vendorType), { module: "more" as const, label: "More" }];

  return (
    <nav aria-label="Merchant navigation" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="grid h-16 grid-cols-5">
        {tabs.map((tab) => {
          const href = base + "/" + tab.module;
          const isActive = pathname.startsWith(href);
          const Icon = MODULE_ICON[tab.module];
          const badge = tab.module === "orders" ? newOrders : 0;
          return (
            <li key={tab.module}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={"relative flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors " + (isActive ? "font-semibold text-accent" : "text-muted hover:text-ink")}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden="true" />
                <span className="max-w-full truncate px-1">{tab.label}</span>
                {badge ? (
                  <span className="absolute right-[calc(50%-20px)] top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
                    {badge}
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
