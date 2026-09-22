"use client";

import React from "react";
import { CategoryIcon } from "@/src/modules/customer-ui/category-icons";

export interface DSCategoryPillProps {
  id: string;
  label: string;
  icon?: React.ReactNode | string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
}

export function DSCategoryPill({
  id,
  label,
  icon,
  isActive = false,
  onClick,
  count,
  className = "",
}: DSCategoryPillProps) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    return <CategoryIcon id={id} size={22} isActive={isActive} />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-2xl p-3 min-w-[76px] select-none ${
        isActive
          ? "border border-red-300 bg-red-50/60 text-red-600 shadow-xs"
          : "border border-gray-100 bg-gray-50/90 text-gray-700 hover:bg-gray-100 hover:border-gray-200"
      } ${className}`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          isActive ? "bg-red-100/50 text-red-600" : "bg-white text-gray-700 shadow-xs"
        }`}
      >
        {renderIcon()}
      </div>
      <span
        className={`mt-2 text-xs font-semibold tracking-tight line-clamp-1 ${
          isActive ? "text-red-600 font-bold" : "text-gray-800"
        }`}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className={`mt-0.5 text-[10px] ${
            isActive ? "text-red-500 font-medium" : "text-gray-400"
          }`}
        >
          {count} items
        </span>
      )}
    </button>
  );
}
