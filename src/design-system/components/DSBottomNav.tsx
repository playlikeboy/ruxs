"use client";

import React from "react";
import { Search, Clock, User, Bookmark, Menu } from "lucide-react";

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

// Exactly matching the 5 icons in the mockup image bottom dock:
// Search (Search), History/Clock (tracking), User (profile), Bookmark (favorites), Menu (cart/more)
const DEFAULT_TABS: NavTabItem[] = [
  { id: "home", label: "Search", icon: Search },
  { id: "tracking", label: "History", icon: Clock },
  { id: "profile", label: "Profile", icon: User },
  { id: "favorites", label: "Projects", icon: Bookmark },
  { id: "cart", label: "More", icon: Menu },
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
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-gray-200/90 bg-white/95 px-2.5 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl select-none ${className}`}
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
              className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-xs select-none"
            >
              <Icon size={16} className="text-white stroke-[2.5]" />
              <span>{tab.label}</span>
              {Boolean(badge) && (
                <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-red-600">
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
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 select-none"
            aria-label={tab.label}
          >
            <Icon size={18} />
            {Boolean(badge) && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
