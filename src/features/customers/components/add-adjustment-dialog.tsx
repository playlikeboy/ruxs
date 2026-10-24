"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
        className="px-3 py-2 bg-surface border border-line text-xs font-semibold text-ink rounded-[10px] hover:border-accent active:scale-95 transition-all shadow-xs"
      >
        + Add Adjustment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-t-[16px] sm:rounded-[12px] border border-line p-5 space-y-4 shadow-lg animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  Add Khata Adjustment
                </h3>
                <p className="text-xs text-muted">
                  For {customerName}. All entries are immutable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-ink text-sm p-1"
              >
                <UiIcon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCredit(false)}
                  className={`py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                    !isCredit
                      ? "bg-ink text-white border-ink"
                      : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                  }`}
                >
                  + Add Charge
                </button>
                <button
                  type="button"
                  onClick={() => setIsCredit(true)}
                  className={`py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                    isCredit
                      ? "bg-good text-white border-good"
                      : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                  }`}
                >
                  − Give Credit / Discount
                </button>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Amount in Rupees (₹)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full px-3 py-2 text-base bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Reason Note (Required)
                </label>
                <input
                  id="notes"
                  type="text"
                  required
                  placeholder="e.g. Waived meal fee / extra deposit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-3 bg-[#FAFAF7] text-muted text-xs font-medium rounded-[10px] border border-line hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 px-3 bg-accent text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isPending ? "Recording..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
