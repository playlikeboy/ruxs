"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/components/ui/cn";

/**
 * A modal built on the native <dialog>: focus moves into it, Tab stays inside,
 * Escape closes it and the page behind is inert. `busy` blocks closing while
 * a server action runs.
 */
export function AdminDialog({
  open,
  onClose,
  title,
  description,
  icon,
  tone = "bad",
  busy = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "bad" | "accent";
  busy?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[16px] border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/60"
    >
      {open && (
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            {icon && (
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  tone === "bad" ? "bg-bad/10 text-bad" : "bg-accent/10 text-accent"
                )}
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
