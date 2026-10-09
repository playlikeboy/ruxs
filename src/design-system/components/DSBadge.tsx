"use client";

import React from "react";
import { Flame, Clock, Star, Sparkles, CheckCircle2 } from "lucide-react";

export interface DSBadgeProps {
  children?: React.ReactNode;
  variant?:
    | "default"
    | "calorie"
    | "time"
    | "rating"
    | "discount"
    | "success"
    | "warning"
    | "muted"
    | "coral"
    | "pastel-blue"
    | "pastel-yellow"
    | "pastel-pink";
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
  const baseClasses =
    "inline-flex items-center gap-1.5 font-semibold rounded-full transition-colors select-none";

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  let variantClasses = "";
  let defaultIcon: React.ReactNode = null;

  switch (variant) {
    case "calorie":
      variantClasses = "bg-coral/15 text-action border border-coral/30";
      defaultIcon = <Flame className="h-3 w-3 text-action fill-coral/30" />;
      break;
    case "time":
      variantClasses = "bg-surface-band text-ink-muted border border-border";
      defaultIcon = <Clock className="h-3 w-3 text-ink-muted" />;
      break;
    case "rating":
      variantClasses = "bg-[#FFE59C]/50 text-[#B45309] border border-[#FFE59C] font-bold";
      defaultIcon = <Star className="h-3 w-3 text-[#F59E0B] fill-[#F59E0B]" />;
      break;
    case "discount":
      variantClasses = "bg-coral text-white font-bold uppercase tracking-wider shadow-xs";
      break;
    case "coral":
      variantClasses = "bg-coral/15 text-action border border-coral/30 font-bold";
      defaultIcon = <Sparkles className="h-3 w-3 text-action" />;
      break;
    case "pastel-blue":
      variantClasses = "bg-cat-blue/40 text-ink border border-cat-blue/70";
      break;
    case "pastel-yellow":
      variantClasses = "bg-cat-yellow/50 text-ink border border-cat-yellow/70";
      break;
    case "pastel-pink":
      variantClasses = "bg-cat-pink/40 text-ink border border-cat-pink/70";
      break;
    case "success":
      variantClasses = "bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 font-bold";
      defaultIcon = <CheckCircle2 className="h-3 w-3 text-[#2E7D32]" />;
      break;
    case "warning":
      variantClasses = "bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20 font-bold";
      break;
    case "muted":
      variantClasses = "bg-surface-band text-ink-muted border border-border";
      break;
    case "default":
    default:
      variantClasses = "bg-surface-band text-ink border border-border";
      break;
  }

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {icon ?? defaultIcon}
      <span>{children}</span>
    </span>
  );
}
