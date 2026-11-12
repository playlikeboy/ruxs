"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { UiIcon } from "@/components/ui/app-icon";
import { addAdjustment } from "@/features/ledger/actions";

interface AddAdjustmentDialogProps {
  slug: string;
  customerId: string;
  customerName: string;
}

export function AddAdjustmentDialog({
  slug,
  customerId,
  customerName,
}: AddAdjustmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCredit, setIsCredit] = useState(false); // false = charge (+), true = discount/credit (-)
  const [amountRupees, setAmountRupees] = useState("");
  const [notes, setNotes] = useState("");
  const titleId = useId();

  // Escape closes the dialog, like any modal.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(amountRupees);
    if (isNaN(rawVal) || rawVal <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!notes.trim()) {
      toast.error("A reason note is required for ledger adjustments");
      return;
    }

    const finalAmount = isCredit ? -Math.abs(rawVal) : Math.abs(rawVal);

    startTransition(async () => {
      const res = await addAdjustment({
        slug,
        customerId,
        amountRupees: finalAmount,
        notes: notes.trim(),
      });

      if (!res.ok) {
        toast.error(res.error ?? "Failed to add adjustment");
      } else {
        toast.success("Adjustment added to khata");
        setIsOpen(false);
        setAmountRupees("");
        setNotes("");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-10 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent active:scale-95"
      >
        Add adjustment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md space-y-4 rounded-t-2xl border border-line bg-surface p-5 shadow-lg sm:rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 id={titleId} className="text-base font-semibold text-ink">
                  Add khata adjustment
                </h3>
                <p className="text-xs text-muted">
                  For {customerName}. All entries are immutable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm text-muted hover:bg-app-canvas hover:text-ink"
              >
                <UiIcon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Entry type">
                <button
                  type="button"
                  onClick={() => setIsCredit(false)}
                  aria-pressed={!isCredit}
                  className={`min-h-10 py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                    !isCredit
                      ? "bg-ink text-white border-ink"
                      : "bg-app-canvas text-muted border-line hover:bg-surface"
                  }`}
                >
                  Add charge
                </button>
                <button
                  type="button"
                  onClick={() => setIsCredit(true)}
                  aria-pressed={isCredit}
                  className={`min-h-10 py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                    isCredit
                      ? "bg-good text-white border-good"
                      : "bg-app-canvas text-muted border-line hover:bg-surface"
                  }`}
                >
                  Give credit or discount
                </button>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Amount (₹)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full px-3 py-2 text-base bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Reason (required)
                </label>
                <input
                  id="notes"
                  type="text"
                  required
                  placeholder="e.g. Waived meal fee / extra deposit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-11 flex-1 rounded-control border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-app-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-11 flex-1 rounded-control bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
