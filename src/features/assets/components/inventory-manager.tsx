"use client";

import { useState } from "react";
import { toast } from "sonner";
import { recordAssetMovement } from "../actions";

interface CustomerHolding {
  id: string;
  name: string;
  society: string;
  tower: string;
  flat: string;
  phone: string;
  cansHeld: number;
  dabbasHeld: number;
}

interface RecentMovement {
  id: string;
  customerId: string;
  customerName: string;
  flat: string;
  society: string;
  asset: string;
  delta: number;
  createdAt: Date;
}

export function InventoryManager({
  slug,
  customerHoldings,
  recentMovements,
}: {
  slug: string;
  customerHoldings: CustomerHolding[];
  recentMovements: RecentMovement[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHolding | null>(
    null
  );
  const [assetType, setAssetType] = useState<"can" | "dabba">("can");
  const [actionType, setActionType] = useState<"issue" | "collect">("collect");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const filtered = customerHoldings.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.flat.toLowerCase().includes(q) ||
      c.society.toLowerCase().includes(q)
    );
  });

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setLoading(true);
    const delta = actionType === "issue" ? qty : -qty;

    try {
      const res = await recordAssetMovement({
        slug,
        customerId: selectedCustomer.id,
        asset: assetType,
        delta,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(
        `${actionType === "issue" ? "Issued" : "Collected"} ${qty} ${
          assetType === "can" ? "can(s)" : "dabba(s)"
        }`
      );
      setSelectedCustomer(null);
      setQty(1);
    } catch {
      toast.error("Failed to update inventory movement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Asset Holdings Section */}
      <div className="bg-surface border border-line rounded-[14px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Customer Asset Holdings
            </h3>
            <p className="text-xs text-muted">
              Track 20L water cans and tiffin dabbas held by each household.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search customer, flat, society..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent w-full sm:w-64"
          />
        </div>

        <div className="divide-y divide-line/60 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">
              No matching customers found.
            </p>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-semibold text-ink text-sm">{c.name}</h4>
                  <p className="text-[11px] text-muted">
                    Flat {c.flat}, {c.tower ? `Tower ${c.tower}, ` : ""}{c.society}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-right">
                    <div className="px-2 py-1 bg-[#FAFAF7] border border-line rounded-[6px]">
                      <span className="text-[10px] text-muted block">Cans</span>
                      <span className="font-mono font-bold text-ink">
                        {c.cansHeld}
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-[#FAFAF7] border border-line rounded-[6px]">
                      <span className="text-[10px] text-muted block">Dabbas</span>
                      <span className="font-mono font-bold text-ink">
                        {c.dabbasHeld}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setQty(1);
                    }}
                    className="px-2.5 py-1.5 bg-accent text-white font-medium text-xs rounded-[6px] hover:opacity-90 active:scale-95 transition-all"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Movements Log */}
      <div className="bg-surface border border-line rounded-[14px] p-4 sm:p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Recent Movements</h3>
          <p className="text-xs text-muted">
            Latest circular movements recorded during delivery runs.
          </p>
        </div>

        {recentMovements.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">
            No circular asset movements recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-line/60">
            {recentMovements.map((m) => (
              <div
                key={m.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-ink">{m.customerName}</span>
                  <span className="text-muted text-[11px] block">
                    Flat {m.flat}, {m.society}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-xs ${
                      m.delta > 0 ? "text-[#B42318]" : "text-good"
                    }`}
                  >
                    {m.delta > 0 ? `+${m.delta}` : m.delta} {m.asset}
                  </span>
                  <span className="text-[10px] text-muted block">
                    {new Date(m.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-[16px] max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-sm font-semibold text-ink">
                Record Movement · {selectedCustomer.name}
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-muted hover:text-ink text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjust} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink">Asset</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssetType("can")}
                    className={`py-2 text-xs rounded-[8px] font-medium border ${
                      assetType === "can"
                        ? "border-accent bg-[#FFE8DD] text-accent"
                        : "border-line bg-bg text-ink"
                    }`}
                  >
                    20L Water Can
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetType("dabba")}
                    className={`py-2 text-xs rounded-[8px] font-medium border ${
                      assetType === "dabba"
                        ? "border-accent bg-[#FFE8DD] text-accent"
                        : "border-line bg-bg text-ink"
                    }`}
                  >
                    Tiffin Dabba
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType("collect")}
                    className={`py-2 text-xs rounded-[8px] font-medium border ${
                      actionType === "collect"
                        ? "border-good bg-[#E1F3E7] text-good"
                        : "border-line bg-bg text-ink"
                    }`}
                  >
                    Collect / Return (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType("issue")}
                    className={`py-2 text-xs rounded-[8px] font-medium border ${
                      actionType === "issue"
                        ? "border-accent bg-[#FFE8DD] text-accent"
                        : "border-line bg-bg text-ink"
                    }`}
                  >
                    Issue / Deliver (+)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 border border-line rounded-[8px] font-bold text-base flex items-center justify-center bg-bg"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-base flex-1 text-center">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-9 h-9 border border-line rounded-[8px] font-bold text-base flex items-center justify-center bg-bg"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-2 text-xs border border-line rounded-[8px] text-ink hover:bg-line/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 text-xs bg-accent text-white font-medium rounded-[8px] hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
