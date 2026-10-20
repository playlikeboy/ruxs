"use client";

import { UtensilsCrossed, Printer, CheckCircle2, AlertTriangle, ChefHat } from "lucide-react";

interface TiffinKitchenPrepProps {
  storeName: string;
  totalMeals: number;
  confirmedProducts: {
    id: string;
    name: string;
    qty: number;
  }[];
  skipsToday: {
    customerName: string;
    flat: string;
    tower: string;
    society: string;
    productName: string;
  }[];
}

export function TiffinKitchenPrep({
  storeName,
  totalMeals,
  confirmedProducts,
  skipsToday,
}: TiffinKitchenPrepProps) {
  // Infer meal characteristics from product names
  const vegCount = confirmedProducts
    .filter((p) => !p.name.toLowerCase().includes("chicken") && !p.name.toLowerCase().includes("egg") && !p.name.toLowerCase().includes("non-veg") && !p.name.toLowerCase().includes("fish"))
    .reduce((s, p) => s + p.qty, 0);

  const nonVegCount = confirmedProducts
    .filter((p) => p.name.toLowerCase().includes("chicken") || p.name.toLowerCase().includes("egg") || p.name.toLowerCase().includes("non-veg") || p.name.toLowerCase().includes("fish"))
    .reduce((s, p) => s + p.qty, 0);

  // Extra rotis estimate (assuming standard 4 rotis per tiffin or explicit extra roti orders)
  const extraRotis = confirmedProducts
    .filter((p) => p.name.toLowerCase().includes("roti") || p.name.toLowerCase().includes("chapati"))
    .reduce((s, p) => s + p.qty, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-[18px] border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-5 shadow-2xs space-y-4 print:border-none print:bg-white print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-2xs">
            <ChefHat className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Kitchen Prep · {storeName}</h2>
            <p className="text-xs text-muted">Daily head-count sheet for cook, meal segregation &amp; skip list</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-amber-600 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-amber-700 active:scale-95 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Print Kitchen Sheet</span>
        </button>
      </div>

      {/* Headcount KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-[12px] border border-amber-100 bg-white/90 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Total Tiffins To Pack</p>
          <p className="mt-1 font-mono text-3xl font-black text-ink tabular-nums">
            {totalMeals}
          </p>
          <p className="text-muted text-[11px]">Boxes needed for today</p>
        </div>

        <div className="rounded-[12px] border border-amber-100 bg-white/90 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-good tracking-wider">Pure Veg Tiffins</p>
          <p className="mt-1 font-mono text-3xl font-black text-good tabular-nums">
            {vegCount}
          </p>
          <p className="text-muted text-[11px]">Green label boxes</p>
        </div>

        <div className="rounded-[12px] border border-amber-100 bg-white/90 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-bad tracking-wider">Non-Veg Tiffins</p>
          <p className="mt-1 font-mono text-3xl font-black text-bad tabular-nums">
            {nonVegCount}
          </p>
          <p className="text-muted text-[11px]">Red label boxes</p>
        </div>

        <div className="rounded-[12px] border border-amber-100 bg-white/90 p-3 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Rotis Headcount</p>
          <p className="mt-1 font-mono text-3xl font-black text-ink tabular-nums">
            {totalMeals * 4 + extraRotis}
          </p>
          <p className="text-muted text-[11px]">Est. 4 rotis/box + extras</p>
        </div>
      </div>

      {/* Itemized Prep Breakdown & Skips List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
        {/* Menu Items to Cook */}
        <div className="rounded-[14px] border border-amber-100/90 bg-white/80 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <UtensilsCrossed className="h-4 w-4 text-amber-600" />
            <span>Items to Cook Today</span>
          </div>
          {confirmedProducts.length === 0 ? (
            <p className="text-muted text-xs">No active subscription meals scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-amber-100/60">
              {confirmedProducts.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-[6px]">
                    {p.qty} portions
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Skipped Today List */}
        <div className="rounded-[14px] border border-amber-100/90 bg-white/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <AlertTriangle className="h-4 w-4 text-warn" />
              <span>Paused / Skipped for Today</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-muted">
              {skipsToday.length} skips
            </span>
          </div>

          {skipsToday.length === 0 ? (
            <div className="flex items-center gap-2 text-good py-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Full attendance today. No customer skips recorded.</span>
            </div>
          ) : (
            <ul className="divide-y divide-amber-100/60 max-h-48 overflow-y-auto">
              {skipsToday.map((s, idx) => (
                <li key={idx} className="py-1.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{s.customerName}</p>
                    <p className="text-[10px] text-muted">
                      {s.flat}{s.tower !== "-" ? `, ${s.tower}` : ""} · {s.society}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
                    Skipped {s.productName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
