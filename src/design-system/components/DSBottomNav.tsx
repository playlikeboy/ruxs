"use client";

import React from "react";
import Link from "next/link";
import { Compass, Sparkles, Clock, BookOpen, ShoppingBag } from "lucide-react";
import { CUSTOMER_TAB_ROUTES } from "@/src/modules/customer-ui/routes";

export type NavTabId = "home" | "favorites" | "cart" | "tracking" | "profile";

export interface NavTabItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badgeCount?: number;
}

export interface DSBottomNavProps {
  activeTab: NavTabId;
  onTabChange?: (tab: NavTabId) => void;
  cartCount?: number;
  className?: string;
}

const DEFAULT_TABS: NavTabItem[] = [
  { id: "home", label: "Discover", icon: Compass },
  { id: "favorites", label: "Services", icon: Sparkles },
  { id: "tracking", label: "Routines", icon: Clock },
  { id: "profile", label: "Khata", icon: BookOpen },
  { id: "cart", label: "Cart", icon: ShoppingBag },
];

export function DSBottomNav({
  activeTab,
  onTabChange,
  cartCount = 0,
  className = "",
}: DSBottomNavProps) {
  return (
    <nav
      aria-label="Customer app navigation"
      className={`fixed inset-x-1/2 bottom-4 z-50 flex w-[min(calc(100vw-24px),520px)] -translate-x-1/2 items-center justify-between gap-1 rounded-full border border-border bg-surface-raised/95 px-2 py-1.5 shadow-floating backdrop-blur-2xl select-none ${className}`}
    >
      {DEFAULT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const badge = tab.id === "cart" && cartCount > 0 ? cartCount : tab.badgeCount;
        const href = CUSTOMER_TAB_ROUTES[tab.id];

        return (
          <Link
            key={tab.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            aria-label={tab.label}
            onClick={() => onTabChange?.(tab.id)}
            className={
              isActive
                ? "flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-action px-3.5 text-xs font-bold text-white shadow-sm sm:px-4 transition-all"
                : "relative flex min-h-10 min-w-10 items-center justify-center rounded-full px-2 text-ink-muted transition-colors hover:bg-surface-band hover:text-ink"
            }
          >
            <Icon size={isActive ? 16 : 18} className={isActive ? "stroke-[2.5]" : undefined} />
            <span className={isActive ? "hidden sm:inline" : "sr-only sm:not-sr-only text-[11px]"}>
              {tab.label}
            </span>
            {Boolean(badge) && (
              <span
                className={
                  isActive
                    ? "ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-action"
                    : "absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold text-white shadow-xs"
                }
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
