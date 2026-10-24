"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markPaid } from "@/features/ledger/actions";

export function MarkPaidDialog({
  slug,
  invoiceId,
  customerName,
  billNumber,
  closingPaise,
}: {
  slug: string;
  invoiceId: string;
  customerName: string;
  billNumber: string;
  closingPaise: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [amountRupees, setAmountRupees] = useState((closingPaise / 100).toString());
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountRupees);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    startTransition(async () => {
      const res = await markPaid({
        slug,
        invoiceId,
        amountRupees: val,
        notes: notes.trim() || undefined,
      });

      if (!res.ok) {
        const errorMsg = "error" in res && typeof res.error === "string" ? res.error : "Failed to record payment";
        toast.error(errorMsg);
      } else {
        toast.success(`Payment recorded for ${billNumber}`);
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1.5 bg-good text-white text-xs font-semibold rounded-[8px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
      >
        Mark Paid
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-t-[16px] sm:rounded-[12px] border border-line p-5 space-y-4 shadow-lg animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink">Record Payment</h3>
                <p className="text-xs text-muted">
                  {billNumber} • {customerName}
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
              <div>
                <label
                  htmlFor="payamt"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Amount Received (₹)
                </label>
                <input
                  id="payamt"
                  type="number"
                  step="0.01"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent tabular-nums font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="paynotes"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Payment Reference / Mode (Optional)
                </label>
                <input
                  id="paynotes"
                  type="text"
                  placeholder="e.g. Google Pay / Cash / UPI"
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
                  className="flex-1 py-2.5 px-3 bg-good text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isPending ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
