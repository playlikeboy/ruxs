"use client";

import React from "react";
import { Star, ChevronRight } from "lucide-react";

export interface DSRatingPillProps {
  rating: number;
  reviewCount?: number | string;
  showChevron?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function DSRatingPill({
  rating,
  reviewCount,
  showChevron = false,
  size = "md",
  className = "",
}: DSRatingPillProps) {
  const isSmall = size === "sm";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.08] ${
        isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } font-semibold text-amber-300 select-none ${className}`}
    >
      <Star className={`${isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} fill-amber-400 text-amber-400`} />
      <span>{rating.toFixed(1)}</span>
      {reviewCount && (
        <span className="font-normal text-muted-foreground">
          ({typeof reviewCount === "number" ? reviewCount.toLocaleString() : reviewCount})
        </span>
      )}
      {showChevron && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
    </div>
  );
}
