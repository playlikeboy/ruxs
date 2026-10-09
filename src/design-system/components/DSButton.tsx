"use client";

import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export interface DSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "coral" | "pastel" | "glass";
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
    let classes =
      "inline-flex items-center justify-center font-medium tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 disabled:opacity-50 disabled:pointer-events-none select-none transition-all duration-150 cursor-pointer";

    if (fullWidth) classes += " w-full";

    switch (size) {
      case "sm":
        classes += " text-xs px-3.5 py-1.5 h-8 gap-1.5 rounded-full font-semibold";
        break;
      case "lg":
        classes += " text-base px-6 py-3 h-12 gap-2.5 rounded-full font-bold";
        break;
      case "icon":
        classes += " h-10 w-10 p-0 rounded-full flex-shrink-0";
        break;
      case "icon-sm":
        classes += " h-8 w-8 p-0 rounded-full flex-shrink-0";
        break;
      case "md":
      default:
        classes += " text-sm px-5 py-2.5 h-10 gap-2 rounded-full font-semibold";
        break;
    }

    switch (variant) {
      case "secondary":
        classes +=
          " bg-surface-raised hover:bg-surface-band text-ink border border-border shadow-xs";
        break;
      case "coral":
        classes +=
          " bg-coral hover:brightness-95 active:scale-[0.98] text-white font-bold shadow-sm";
        break;
      case "pastel":
        classes +=
          " bg-cat-yellow/30 hover:bg-cat-yellow/50 text-ink border border-ink/10";
        break;
      case "outline":
        classes +=
          " bg-transparent hover:bg-surface-band text-ink border border-border";
        break;
      case "ghost":
        classes +=
          " bg-transparent hover:bg-surface-band text-ink-muted hover:text-ink";
        break;
      case "danger":
        classes +=
          " bg-[#C62828]/10 hover:bg-[#C62828]/20 text-[#C62828] border border-[#C62828]/20";
        break;
      case "glass":
        classes +=
          " bg-surface-raised/90 hover:bg-surface-raised text-ink border border-border backdrop-blur-md shadow-xs";
        break;
      case "primary":
      default:
        classes +=
          " bg-action hover:bg-action-hover active:scale-[0.98] text-white font-bold shadow-[0_4px_14px_-2px_rgba(189,75,42,0.28)]";
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
