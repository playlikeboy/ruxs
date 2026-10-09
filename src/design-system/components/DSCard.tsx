"use client";

import React from "react";

export interface DSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass" | "bordered" | "hero" | "blush";
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
  const baseStyle =
    "relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-200";
  const hoverStyle = isHoverable
    ? "hover:-translate-y-0.5 hover:shadow-soft hover:border-border-strong cursor-pointer"
    : "";

  let variantStyle = "";
  switch (variant) {
    case "elevated":
      variantStyle =
        "border border-border bg-surface-raised shadow-soft text-ink";
      break;
    case "glass":
      variantStyle =
        "border border-border/80 bg-surface-raised/90 backdrop-blur-xl shadow-card text-ink";
      break;
    case "bordered":
      variantStyle =
        "border border-border bg-transparent text-ink";
      break;
    case "blush":
      variantStyle =
        "border border-canvas/40 bg-gradient-to-br from-surface-raised via-surface to-canvas-soft/20 shadow-card text-ink";
      break;
    case "hero":
      variantStyle =
        "border border-coral/25 bg-gradient-to-br from-surface-raised via-surface-band to-[#FFEADB]/40 shadow-soft text-ink";
      break;
    case "default":
    default:
      variantStyle =
        "border border-border bg-surface-raised text-ink shadow-card";
      break;
  }

  return (
    <div
      className={`${baseStyle} ${variantStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
