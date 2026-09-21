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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Sheet Container */}
      <div
        className={`relative z-10 flex flex-col w-full max-h-[90vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-3xl border border-white/[0.1] bg-[#0d120f] shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-6 sm:zoom-in-95 ${maxWidth} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe Handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="h-1 w-12 rounded-full bg-white/[0.2]" />
        </div>

        {/* Optional Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-white/[0.08]">
            <div>
              {title && <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>}
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground hover:bg-white/[0.12] hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
