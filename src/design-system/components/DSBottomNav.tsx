"use client";

import React from "react";
import Link from "next/link";
import { Search, Clock, User, Bookmark, ShoppingBag } from "lucide-react";
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
  { id: "home", label: "Search", icon: Search },
  { id: "tracking", label: "History", icon: Clock },
  { id: "profile", label: "Profile", icon: User },
  { id: "favorites", label: "Projects", icon: Bookmark },
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
      className={`fixed inset-x-1/2 bottom-4 z-50 flex w-[min(calc(100vw-24px),620px)] -translate-x-1/2 items-center justify-between gap-1 rounded-full border border-gray-200/90 bg-white/95 px-2 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl select-none ${className}`}
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
                ? "flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-red-500 px-3.5 text-xs font-semibold text-white shadow-sm sm:px-4"
                : "relative flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800"
            }
          >
            <Icon size={isActive ? 16 : 18} className={isActive ? "stroke-[2.5]" : undefined} />
            <span className={isActive ? "hidden sm:inline" : "sr-only sm:not-sr-only"}>
              {tab.label}
            </span>
            {Boolean(badge) && (
              <span
                className={
                  isActive
                    ? "ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-red-600"
                    : "absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
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
