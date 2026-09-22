"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DSBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  maxWidth?: string;
  className?: string;
}

export function DSBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  showCloseButton = true,
  maxWidth = "max-w-lg",
  className = "",
}: DSBottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-gray-900 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Sheet Container */}
      <div
        className={`relative z-10 flex flex-col w-full max-h-[90vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden ${maxWidth} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe Handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Optional Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100">
            <div>
              {title && <h2 className="text-lg font-bold text-gray-950 tracking-tight">{title}</h2>}
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
