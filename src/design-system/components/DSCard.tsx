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
  let baseStyle = "relative overflow-hidden rounded-3xl";

  let variantStyle = "";
  switch (variant) {
    case "elevated":
      variantStyle =
        "border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
      break;
    case "glass":
      variantStyle =
        "border border-gray-200/80 bg-white/90 shadow-sm";
      break;
    case "bordered":
      variantStyle = "border border-gray-200 bg-transparent";
      break;
    case "hero":
      variantStyle =
        "border border-red-100 bg-gradient-to-r from-red-50/50 via-white to-orange-50/30 shadow-xs";
      break;
    case "default":
    default:
      variantStyle = "border border-gray-100 bg-white shadow-xs";
      break;
  }

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </div>
  );
}
