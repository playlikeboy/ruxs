"use client";

import React from "react";
import { Flame, Clock, Star } from "lucide-react";

export interface DSBadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "calorie" | "time" | "rating" | "discount" | "success" | "warning" | "muted";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function DSBadge({
  children,
  variant = "default",
  size = "md",
  className = "",
  icon,
}: DSBadgeProps) {
  let baseClasses =
    "inline-flex items-center gap-1.5 font-medium rounded-full transition-colors select-none";

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  let variantClasses = "";
  let defaultIcon: React.ReactNode = null;

  switch (variant) {
    case "calorie":
      variantClasses = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      defaultIcon = <Flame className="h-3 w-3 text-orange-500 fill-orange-500/20" />;
      break;
    case "time":
      variantClasses = "bg-white/[0.04] text-muted-foreground border border-white/[0.08]";
      defaultIcon = <Clock className="h-3 w-3 text-muted-foreground" />;
      break;
    case "rating":
      variantClasses = "bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold";
      defaultIcon = <Star className="h-3 w-3 text-amber-400 fill-amber-400" />;
      break;
    case "discount":
      variantClasses = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider";
      break;
    case "success":
      variantClasses = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      break;
    case "warning":
      variantClasses = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      break;
    case "muted":
      variantClasses = "bg-white/[0.03] text-muted-foreground border border-white/[0.06]";
      break;
    case "default":
    default:
      variantClasses = "bg-white/[0.06] text-foreground border border-white/[0.08]";
      break;
  }

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {icon ?? defaultIcon}
      <span>{children}</span>
    </span>
  );
}
