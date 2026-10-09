"use client";

import React from "react";
import { CategoryIcon } from "@/src/modules/customer-ui/category-icons";

export interface DSCategoryPillProps {
  id: string;
  label: string;
  icon?: React.ReactNode | string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
}

export function DSCategoryPill({
  id,
  label,
  icon,
  isActive = false,
  onClick,
  count,
  className = "",
}: DSCategoryPillProps) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    return <CategoryIcon id={id} size={22} isActive={isActive} />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-2xl p-2.5 sm:p-3 min-w-[74px] sm:min-w-[80px] transition-all select-none cursor-pointer ${
        isActive
          ? "border-2 border-action bg-surface-raised text-action shadow-card scale-[1.02]"
          : "border border-border bg-surface-raised text-ink-muted hover:bg-surface-band hover:border-border-strong hover:text-ink"
      } ${className}`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
          isActive
            ? "bg-coral/15 text-action shadow-xs"
            : "bg-surface-band text-ink-muted"
        }`}
      >
        {renderIcon()}
      </div>
      <span
        className={`mt-2 text-xs font-semibold tracking-tight line-clamp-1 transition-colors ${
          isActive ? "text-ink font-bold" : "text-ink-muted"
        }`}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className={`mt-0.5 text-[10px] ${
            isActive ? "text-action font-semibold" : "text-ink-subtle"
          }`}
        >
          {count} items
        </span>
      )}
    </button>
  );
}
