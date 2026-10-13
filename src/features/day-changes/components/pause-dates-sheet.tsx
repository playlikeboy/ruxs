"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { pauseDates } from "@/features/day-changes/actions";

export function PauseDatesSheet({
  token,
  defaultStart,
}: {
  token: string;
  defaultStart: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultStart);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before or equal to end date");
      return;
    }

    startTransition(async () => {
      const res = await pauseDates({
        token,
        startDate,
        endDate,
      });

      if (!res.ok) {
        toast.error(res.error ?? "Failed to pause deliveries");
      } else {
        toast.success(`Deliveries paused from ${startDate} to ${endDate}`);
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2.5 px-3 bg-surface border border-line text-xs font-semibold text-ink rounded-[10px] hover:border-accent active:scale-98 transition-all shadow-xs"
      >
        🏖️ Pause for Holiday / Travel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-t-[16px] sm:rounded-[12px] border border-line p-5 space-y-4 shadow-lg animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  Pause Delivery for Holiday
                </h3>
                <p className="text-xs text-muted">
                  Pick a date range to automatically skip meals at ₹0 charge.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pstart" className="block text-xs font-medium text-ink mb-1">
                    From (Start Date)
                  </label>
                  <input
                    id="pstart"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="pend" className="block text-xs font-medium text-ink mb-1">
                    To (End Date)
                  </label>
                  <input
                    id="pend"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>
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
                  {isPending ? "Pausing..." : "Confirm Holiday Pause"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
