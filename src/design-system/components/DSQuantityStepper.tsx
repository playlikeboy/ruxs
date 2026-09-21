"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

export interface DSQuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "pill" | "green-pill" | "bordered";
  className?: string;
  disabled?: boolean;
}

export function DSQuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  variant = "pill",
  className = "",
  disabled = false,
}: DSQuantityStepperProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) onChange(value + 1);
  };

  let containerStyle = "";
  let btnStyle = "";
  let textStyle = "";
  let iconSize = 14;

  if (size === "sm") {
    containerStyle = "h-7 px-1.5 gap-1.5 text-xs";
    btnStyle = "h-5 w-5";
    iconSize = 12;
  } else if (size === "lg") {
    containerStyle = "h-11 px-3 gap-3 text-base";
    btnStyle = "h-8 w-8";
    iconSize = 16;
  } else {
    // md
    containerStyle = "h-9 px-2 gap-2 text-sm";
    btnStyle = "h-6 w-6";
    iconSize = 14;
  }

  if (variant === "green-pill") {
    containerStyle += " rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400";
    btnStyle += " rounded-full bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 transition flex items-center justify-center font-bold";
    textStyle = "font-bold text-emerald-300 min-w-[20px] text-center";
  } else if (variant === "bordered") {
    containerStyle += " rounded-xl border border-white/[0.1] bg-white/[0.03]";
    btnStyle += " rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-foreground active:scale-95 transition flex items-center justify-center";
    textStyle = "font-semibold text-foreground min-w-[24px] text-center font-mono";
  } else {
    // pill (default matching reference Cart)
    containerStyle += " rounded-full bg-white/[0.04] border border-white/[0.08]";
    btnStyle += " rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 active:scale-95 transition flex items-center justify-center";
    textStyle = "font-semibold text-foreground min-w-[22px] text-center font-mono";
  }

  return (
    <div
      className={`inline-flex items-center justify-between select-none ${containerStyle} ${className}`}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        className={`${btnStyle} disabled:opacity-30 disabled:pointer-events-none`}
        aria-label="Decrease quantity"
      >
        <Minus size={iconSize} />
      </button>
      <span className={textStyle}>{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={handleIncrement}
        className={`${btnStyle} disabled:opacity-30 disabled:pointer-events-none`}
        aria-label="Increase quantity"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
