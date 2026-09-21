"use client";

import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface DSSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  animatedPlaceholders?: string[];
  onFilterClick?: () => void;
  showFilter?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function DSSearchBar({
  value,
  onChange,
  placeholder = "Search food, groceries, daily routines...",
  animatedPlaceholders = [
    "Search 'Melting Cheese Pizza'...",
    "Search 'Daily Cow Milk 1L'...",
    "Search 'Bisleri 20L Water Can'...",
    "Search 'Homestyle Thali'...",
    "Search 'Fresh Puja Flowers'...",
    "Search 'Steam Ironing'...",
  ],
  onFilterClick,
  showFilter = true,
  className = "",
  autoFocus = false,
}: DSSearchBarProps) {
  const [currentPlaceholderIdx, setCurrentPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (!animatedPlaceholders.length || value) return;
    const interval = setInterval(() => {
      setCurrentPlaceholderIdx((prev) => (prev + 1) % animatedPlaceholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [animatedPlaceholders, value]);

  const activePlaceholder = value ? "" : (animatedPlaceholders[currentPlaceholderIdx] || placeholder);

  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 transition-all focus-within:border-emerald-500/50 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_20px_rgba(16,185,129,0.15)] ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={activePlaceholder}
        autoFocus={autoFocus}
        className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
      {showFilter && (
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
          aria-label="Filter"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
