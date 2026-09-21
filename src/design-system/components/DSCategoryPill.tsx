"use client";

import React from "react";

export interface DSCategoryPillProps {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
}

export function DSCategoryPill({
  label,
  icon,
  isActive = false,
  onClick,
  count,
  className = "",
}: DSCategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center rounded-2xl p-3 min-w-[76px] transition-all duration-200 select-none ${
        isActive
          ? "border border-emerald-500/50 bg-emerald-500/10 shadow-[0_4px_16px_rgba(16,185,129,0.18)] scale-[1.03]"
          : "border border-white/[0.06] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.05] active:scale-95"
      } ${className}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-200 group-hover:scale-110 ${
          isActive ? "bg-emerald-500/20" : "bg-white/[0.04]"
        }`}
      >
        {typeof icon === "string" ? <span>{icon}</span> : icon}
      </div>
      <span
        className={`mt-2 text-xs font-semibold tracking-tight transition-colors line-clamp-1 ${
          isActive ? "text-emerald-400 font-bold" : "text-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className={`mt-0.5 text-[10px] ${
            isActive ? "text-emerald-500 font-medium" : "text-muted-foreground"
          }`}
        >
          {count} items
        </span>
      )}
    </button>
  );
}
