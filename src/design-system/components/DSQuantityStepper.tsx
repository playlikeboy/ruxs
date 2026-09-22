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
    containerStyle += " rounded-full bg-red-50 border border-red-200 text-red-600";
    btnStyle += " rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center font-bold";
    textStyle = "font-bold text-red-600 min-w-[20px] text-center";
  } else if (variant === "bordered") {
    containerStyle += " rounded-xl border border-gray-200 bg-white";
    btnStyle += " rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center";
    textStyle = "font-semibold text-gray-900 min-w-[24px] text-center font-mono";
  } else {
    // pill (default matching reference Cart)
    containerStyle += " rounded-full bg-gray-50 border border-gray-200";
    btnStyle += " rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center";
    textStyle = "font-semibold text-gray-900 min-w-[22px] text-center font-mono";
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
