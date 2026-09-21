"use client";

import React from "react";

export interface DSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass" | "bordered" | "hero";
  children: React.ReactNode;
  className?: string;
  isHoverable?: boolean;
}

export function DSCard({
  variant = "default",
  children,
  className = "",
  isHoverable = false,
  ...props
}: DSCardProps) {
  let baseStyle = "relative overflow-hidden rounded-3xl transition-all duration-200";

  if (isHoverable) {
    baseStyle += " hover:-translate-y-1 hover:shadow-xl cursor-pointer";
  }

  let variantStyle = "";
  switch (variant) {
    case "elevated":
      variantStyle =
        "border border-white/[0.08] bg-[#121714] shadow-[0_12px_32px_rgba(0,0,0,0.36)]";
      break;
    case "glass":
      variantStyle =
        "border border-white/[0.1] bg-white/[0.03] backdrop-blur-xl shadow-lg";
      break;
    case "bordered":
      variantStyle = "border border-white/[0.12] bg-transparent";
      break;
    case "hero":
      variantStyle =
        "border border-emerald-500/20 bg-gradient-to-br from-[#122319] via-[#0d1612] to-[#0a0f0d] shadow-[0_16px_40px_rgba(16,185,129,0.1)]";
      break;
    case "default":
    default:
      variantStyle = "border border-white/[0.07] bg-[#111613]";
      break;
  }

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </div>
  );
}
