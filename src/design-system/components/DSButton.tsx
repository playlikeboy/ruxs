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
    // Base classes without animations
    let classes =
      "inline-flex items-center justify-center font-medium tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50 disabled:pointer-events-none select-none";

    // Full width
    if (fullWidth) classes += " w-full";

    // Size variants
    switch (size) {
      case "sm":
        classes += " text-xs px-3.5 py-1.5 h-8 gap-1.5 rounded-full";
        break;
      case "lg":
        classes += " text-base px-6 py-3 h-12 gap-2.5 rounded-full font-semibold";
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
          " bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200";
        break;
      case "outline":
        classes +=
          " bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-xs";
        break;
      case "ghost":
        classes += " bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900";
        break;
      case "danger":
        classes += " bg-red-50 hover:bg-red-100 text-red-600 border border-red-200";
        break;
      case "glass":
        classes +=
          " bg-white/90 hover:bg-white text-gray-900 border border-gray-200 shadow-sm";
        break;
      case "primary":
      default:
        classes +=
          " bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold shadow-xs";
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
          <Loader2 className="h-4 w-4 text-current" />
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
