"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface DSSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  showFilter?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function DSSearchBar({
  value,
  onChange,
  placeholder = "Search fresh milk, water, tiffins, flowers...",
  onFilterClick,
  showFilter = true,
  className = "",
  autoFocus = false,
}: DSSearchBarProps) {
  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-full border border-border bg-surface-raised px-4 py-1.5 shadow-card transition-all focus-within:border-action focus-within:ring-2 focus-within:ring-coral/20 hover:shadow-soft ${className}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral/10 text-action">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle outline-none font-medium"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-band text-ink-muted hover:text-ink transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {showFilter && (
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-white shadow-xs hover:bg-action-hover active:scale-95 transition-all cursor-pointer"
          aria-label="Filter"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
