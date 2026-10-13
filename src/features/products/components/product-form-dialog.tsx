"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProduct } from "@/features/products/actions";

interface Product {
  id?: string;
  kind?: string;
  name?: string;
  shift?: string;
  pricePaise?: number;
  depositPaise?: number;
  assetName?: string | null;
  cutoffAt?: string;
  lateRule?: string;
}

export function ProductFormDialog({
  slug,
  product,
  triggerLabel = "+ Add Product",
}: {
  slug: string;
  product?: Product;
  triggerLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [kind, setKind] = useState<"tiffin" | "water">(
    (product?.kind as "tiffin" | "water") ?? "tiffin"
  );
  const [name, setName] = useState(product?.name ?? "");
  const [shift, setShift] = useState<"lunch" | "dinner" | "morning" | "evening">(
    (product?.shift as "lunch" | "dinner" | "morning" | "evening") ?? "lunch"
  );
  const [priceRupees, setPriceRupees] = useState(
    product?.pricePaise ? (product.pricePaise / 100).toString() : ""
  );
  const [depositRupees, setDepositRupees] = useState(
    product?.depositPaise ? (product.depositPaise / 100).toString() : "0"
  );
  const [assetName, setAssetName] = useState(product?.assetName ?? "");
  const [cutoffAt, setCutoffAt] = useState(product?.cutoffAt ?? "10:00");
  const [lateRule, setLateRule] = useState<"free" | "half" | "full" | "locked">(
    (product?.lateRule as "free" | "half" | "full" | "locked") ?? "full"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(priceRupees);
    const depVal = parseFloat(depositRupees || "0");

    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    startTransition(async () => {
      const res = await saveProduct({
        slug,
        id: product?.id,
        kind,
        name: name.trim(),
        shift,
        priceRupees: priceVal,
        depositRupees: isNaN(depVal) ? 0 : depVal,
        assetName: assetName.trim() || undefined,
        cutoffAt,
        lateRule,
      });

      if (!res.ok) {
        toast.error(res.error ?? "Failed to save product");
      } else {
        toast.success(product?.id ? "Product updated" : "Product added");
        setIsOpen(false);
        if (!product?.id) {
          setName("");
          setPriceRupees("");
          setDepositRupees("0");
        }
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 bg-accent text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-t-[16px] sm:rounded-[12px] border border-line p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-lg animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {product?.id ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-muted">
                  Configure meals, shifts, cutoffs, and late policies.
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setKind("tiffin");
                    if (!assetName) setAssetName("dabba");
                  }}
                  className={`py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                    kind === "tiffin"
                      ? "bg-accent text-white border-accent"
                      : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                  }`}
                >
                  🍱 Tiffin Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKind("water");
                    if (!assetName) setAssetName("can");
                  }}
                  className={`py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                    kind === "water"
                      ? "bg-accent text-white border-accent"
                      : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                  }`}
                >
                  💧 20L Water Can
                </button>
              </div>

              <div>
                <label htmlFor="pname" className="block text-xs font-medium text-ink mb-1">
                  Product / Meal Name
                </label>
                <input
                  id="pname"
                  type="text"
                  required
                  placeholder={kind === "tiffin" ? "e.g. Standard Veg Lunch Thali" : "e.g. 20L Bisleri Water Can"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pshift" className="block text-xs font-medium text-ink mb-1">
                    Delivery Shift
                  </label>
                  <select
                    id="pshift"
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent capitalize"
                  >
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pcutoff" className="block text-xs font-medium text-ink mb-1">
                    Cutoff Time (IST)
                  </label>
                  <input
                    id="pcutoff"
                    type="time"
                    required
                    value={cutoffAt}
                    onChange={(e) => setCutoffAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pprice" className="block text-xs font-medium text-ink mb-1">
                    Price per Unit (₹)
                  </label>
                  <input
                    id="pprice"
                    type="number"
                    step="0.01"
                    required
                    placeholder="90"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="pdeposit" className="block text-xs font-medium text-ink mb-1">
                    Deposit (₹)
                  </label>
                  <input
                    id="pdeposit"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={depositRupees}
                    onChange={(e) => setDepositRupees(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="passet" className="block text-xs font-medium text-ink mb-1">
                    Asset Name (Optional)
                  </label>
                  <input
                    id="passet"
                    type="text"
                    placeholder="dabba or can"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label htmlFor="plate" className="block text-xs font-medium text-ink mb-1">
                    Late Skip Policy
                  </label>
                  <select
                    id="plate"
                    value={lateRule}
                    onChange={(e) => setLateRule(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent capitalize"
                  >
                    <option value="full">Full Charge (100%)</option>
                    <option value="half">Half Charge (50%)</option>
                    <option value="free">Free (0%)</option>
                    <option value="locked">Locked (Refuse skip)</option>
                  </select>
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
                  {isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
