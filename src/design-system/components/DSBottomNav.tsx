"use client";

import React from "react";
import { Home, Heart, ShoppingBag, MapPin, User, Receipt } from "lucide-react";

export type NavTabId = "home" | "favorites" | "cart" | "tracking" | "profile";

export interface NavTabItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badgeCount?: number;
}

export interface DSBottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  cartCount?: number;
  className?: string;
}

const DEFAULT_TABS: NavTabItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "favorites", label: "Routines", icon: Heart },
  { id: "cart", label: "Cart", icon: ShoppingBag },
  { id: "tracking", label: "Tracking", icon: MapPin },
  { id: "profile", label: "Khata", icon: Receipt },
];

export function DSBottomNav({
  activeTab,
  onTabChange,
  cartCount = 0,
  className = "",
}: DSBottomNavProps) {
  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#0d120f]/90 px-2 py-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(16,185,129,0.1)] backdrop-blur-2xl transition-all duration-300 ${className}`}
    >
      {DEFAULT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const badge = tab.id === "cart" && cartCount > 0 ? cartCount : tab.badgeCount;

        if (isActive) {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-black shadow-[0_4px_12px_rgba(16,185,129,0.35)] transition-all duration-200 select-none scale-105"
            >
              <Icon size={16} className="text-black stroke-[2.5]" />
              <span>{tab.label}</span>
              {Boolean(badge) && (
                <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-emerald-400">
                  {badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-white/[0.08] hover:text-foreground active:scale-90 select-none"
            aria-label={tab.label}
          >
            <Icon size={18} />
            {Boolean(badge) && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-black">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
