"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import { Droplet, RotateCcw, PackageCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { recordAssetMovement } from "@/features/assets/actions";

interface WaterCanHubProps {
  slug: string;
  customers: { id: string; name: string; flat: string; society: string }[];
  outstandingCans: number;
  householdsCount: number;
}

export function WaterCanHub({
  slug,
  customers,
  outstandingCans,
  householdsCount,
}: {
  slug: string;
  customers: WaterCanHubProps["customers"];
  outstandingCans: number;
  householdsCount: number;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id ?? "");
  const [delta, setDelta] = useState<number>(-1); // -1 = returned empty can, +1 = issued extra can
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [showLogModal, setShowLogModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Please select a household");
      return;
    }

    startTransition(async () => {
      const res = await recordAssetMovement({
        slug,
        customerId: selectedCustomer,
        asset: "can",
        delta,
      });

      if (res.ok) {
        toast.success(
          delta < 0
            ? "Recorded empty bottle return! Inventory updated."
            : "Recorded extra bottle delivered! Inventory updated."
        );
        setShowLogModal(false);
        setNotes("");
      } else {
        toast.error(res.error || "Failed to record movement");
      }
    });
  };

  return (
    <div className="rounded-[18px] border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
            <Droplet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Water Can Fleet &amp; Bottle Tracker</h2>
            <p className="text-xs text-muted">20L returnable cans, bottle deposits &amp; empty returns</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-blue-600 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Quick Log Can Return</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-[12px] border border-blue-100 bg-white/80 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Cans With Customers</p>
          <p className="mt-1 font-mono text-2xl font-black text-ink tabular-nums">
            {outstandingCans}
          </p>
          <p className="text-muted text-[11px]">{householdsCount} households holding cans</p>
        </div>

        <div className="rounded-[12px] border border-blue-100 bg-white/80 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Avg. Deposit Balance</p>
          <p className="mt-1 font-mono text-2xl font-black text-ink tabular-nums">
            ₹{(outstandingCans * 150).toLocaleString("en-IN")}
          </p>
          <p className="text-muted text-[11px]">Est. security deposit held</p>
        </div>

        <div className="rounded-[12px] border border-blue-100 bg-white/80 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Bottle Condition</p>
          <p className="mt-1 text-sm font-bold text-good flex items-center gap-1">
            <PackageCheck className="h-4 w-4" /> 100% Food-Grade
          </p>
          <p className="text-muted text-[11px]">BPA-free reusable polycarbonate</p>
        </div>

        <div className="rounded-[12px] border border-blue-100 bg-white/80 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Collection Priority</p>
          <p className="mt-1 text-sm font-bold text-accent flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> Collect at Drop-off
          </p>
          <p className="text-muted text-[11px]">Swap empty can on each stop</p>
        </div>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] border border-line bg-surface p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-sm text-ink">Record Bottle Movement</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                <UiIcon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Select Household</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-xs text-ink focus:border-ink focus:outline-none"
                  required
                >
                  <option value="" disabled>Choose customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.flat}, {c.society}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Movement Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDelta(-1)}
                    className={
                      "flex h-10 items-center justify-center rounded-[10px] border text-xs font-semibold transition " +
                      (delta < 0
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-line bg-surface text-muted hover:bg-bg")
                    }
                  >
                    Empty Can Returned (-1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelta(1)}
                    className={
                      "flex h-10 items-center justify-center rounded-[10px] border text-xs font-semibold transition " +
                      (delta > 0
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-line bg-surface text-muted hover:bg-bg")
                    }
                  >
                    Extra Can Issued (+1)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Returned 1 can via security gate"
                  className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-xs placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="h-9 rounded-[8px] border border-line px-3 text-xs font-medium text-muted hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-9 rounded-[8px] bg-blue-600 px-4 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
