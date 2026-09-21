"use client";

import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export interface DSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const DSButton = forwardRef<HTMLButtonElement, DSButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes
    let classes =
      "inline-flex items-center justify-center font-medium tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    // Full width
    if (fullWidth) classes += " w-full";

    // Size variants
    switch (size) {
      case "sm":
        classes += " text-xs px-3.5 py-1.5 h-8 gap-1.5 rounded-full";
        break;
      case "lg":
        classes += " text-base px-6 py-3.5 h-12 gap-2.5 rounded-full font-semibold";
        break;
      case "icon":
        classes += " h-10 w-10 p-0 rounded-full flex-shrink-0";
        break;
      case "icon-sm":
        classes += " h-8 w-8 p-0 rounded-full flex-shrink-0";
        break;
      case "md":
      default:
        classes += " text-sm px-5 py-2.5 h-10 gap-2 rounded-full font-medium";
        break;
    }

    // Color/Style variants
    switch (variant) {
      case "secondary":
        classes +=
          " bg-white/[0.06] hover:bg-white/[0.1] text-foreground border border-white/[0.08] backdrop-blur-md";
        break;
      case "outline":
        classes +=
          " bg-transparent hover:bg-white/[0.04] text-foreground border border-white/[0.12]";
        break;
      case "ghost":
        classes += " bg-transparent hover:bg-white/[0.06] text-muted-foreground hover:text-foreground";
        break;
      case "danger":
        classes += " bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20";
        break;
      case "glass":
        classes +=
          " bg-black/40 hover:bg-black/60 text-white border border-white/[0.15] backdrop-blur-xl shadow-lg";
        break;
      case "primary":
      default:
        classes +=
          " bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)]";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${classes} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

DSButton.displayName = "DSButton";
