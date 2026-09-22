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
  placeholder = "Search your place here",
  onFilterClick,
  showFilter = true,
  className = "",
  autoFocus = false,
}: DSSearchBarProps) {
  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white px-3.5 py-1.5 shadow-xs focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none font-normal"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
      {showFilter && (
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600 active:bg-red-700"
          aria-label="Filter"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
