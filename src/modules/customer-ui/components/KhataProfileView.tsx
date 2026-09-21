"use client";

import React, { useState } from "react";
import {
  Receipt,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { DSButton } from "@/src/design-system";

export function KhataProfileView() {
  const { currentGeofence } = useCustomerUI();
  const [settled, setSettled] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Digital Khata & Household Statement
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          End-of-month consolidated statement for {currentGeofence.societyName}
        </p>
      </div>

      {/* Khata Balance Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#12241a] via-[#0e1713] to-[#0b0f0d] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Digital Khata Balance
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
            <ShieldCheck size={12} /> Verified Ledger
          </span>
        </div>

        <div className="mt-4">
          <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {settled ? "$0.00" : "$142.00"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {settled ? "All household merchant balances cleared" : "Due on 1st of next month · 4 vendors active"}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <DSButton
            variant="primary"
            size="md"
            onClick={() => setSettled(true)}
            disabled={settled}
          >
            {settled ? "Settled via Auto-Pay ✓" : "Pay via Auto-Debit · $142.00"}
          </DSButton>

          <button
            type="button"
            className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-foreground hover:bg-white/[0.08] transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Verified Vendors in Khata */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#121714] p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Associated Society Merchants
        </h3>

        <div className="space-y-2.5">
          {[
            { name: "Krishna Fresh Dairy", type: "Milk (Daily 1L)", amount: "$65.00", items: "10 deliveries" },
            { name: "Ganga RO Aqua", type: "Water (20L Cans)", amount: "$24.00", items: "6 cans exchanged" },
            { name: "Annapurna Kitchens", type: "Homestyle Tiffin", amount: "$36.00", items: "3 dinners" },
            { name: "Pushpam Pooja Florals", type: "Daily Flowers", amount: "$17.00", items: "11 baskets" },
          ].map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-base">
                  <Building size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">{v.type} · {v.items}</p>
                </div>
              </div>

              <span className="text-xs font-bold font-mono text-foreground">{v.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
