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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-ink font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#5A554B]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Sheet Container */}
      <div
        className={`relative z-10 flex flex-col w-full max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-3xl border border-border bg-surface-raised text-ink shadow-floating overflow-hidden ${maxWidth} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe Handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-ink/15" />
        </div>

        {/* Optional Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-border">
            <div>
              {title && <h2 className="text-lg font-bold text-ink tracking-tight">{title}</h2>}
              {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-band text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
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
