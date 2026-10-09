"use client";

import React, { useState } from "react";
import { Check, X, Shield, ArrowRight, Clock, Sparkles } from "lucide-react";

type ProofTab = "autopilot" | "khata" | "security";

export function ImpeccableHeroProof() {
  const [activeTab, setActiveTab] = useState<ProofTab>("autopilot");
  const [sliderPosition, setSliderPosition] = useState<number>(68);

  return (
    <div className="w-full rounded-2xl border border-[#5A554B]/12 bg-white p-4 sm:p-6 shadow-sm">
      {/* Proof Mode Segmented Instrument Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#5A554B]/8 pb-4">
        <div>
          <span className="ks-tag">Transformation Proof</span>
          <p className="mt-1 text-xs text-[#746E63] font-medium">
            Drag the slider to compare chaotic WhatsApp tallies with RUXS operating routines.
          </p>
        </div>

        <div className="ks-instrument-strip self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setActiveTab("autopilot")}
            className={`ks-instrument-key ${activeTab === "autopilot" ? "is-active" : ""}`}
          >
            <span className={`cc-led ${activeTab === "autopilot" ? "is-active" : ""}`} />
            /autopilot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("khata")}
            className={`ks-instrument-key ${activeTab === "khata" ? "is-active" : ""}`}
          >
            <span className={`cc-led ${activeTab === "khata" ? "is-active" : ""}`} />
            /khata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`ks-instrument-key ${activeTab === "security" ? "is-active" : ""}`}
          >
            <span className={`cc-led ${activeTab === "security" ? "is-active" : ""}`} />
            /security
          </button>
        </div>
      </div>

      {/* Comparison Stage with Split Reveal */}
      <div className="relative mt-5 h-[340px] sm:h-[300px] w-full overflow-hidden rounded-xl border border-[#5A554B]/10 bg-[#FFF8ED]">
        {/* BEFORE LAYER (Behind) */}
        <div className="absolute inset-0 flex flex-col justify-between p-5 bg-[#FFF2DF]/60">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              <X size={12} />
              Before · WhatsApp & Notebook Chaos
            </span>
            <span className="text-[10px] font-mono text-[#9B958B]">Manual Tally</span>
          </div>

          {activeTab === "autopilot" && (
            <div className="my-auto space-y-2">
              <div className="rounded-xl border border-rose-200 bg-white/90 p-3 shadow-2xs">
                <p className="text-[11px] font-bold text-rose-900">06:45 AM · Resident to Milkman:</p>
                <p className="text-xs text-rose-700 italic">"Bhaiya aaj 1 litre extra doodh rakhna tha. Aapne rakha kya?"</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-white/90 p-3 shadow-2xs">
                <p className="text-[11px] font-bold text-rose-900">08:10 AM · Milkman reply:</p>
                <p className="text-xs text-rose-700 italic">"Sorry madam message nahi dekha tha, kal se deta hoon."</p>
              </div>
              <p className="text-[11px] font-semibold text-rose-800">
                ⚠️ Result: Ruined breakfast, lost cutoff deadlines, and daily follow-up fatigue.
              </p>
            </div>
          )}

          {activeTab === "khata" && (
            <div className="my-auto space-y-2">
              <div className="rounded-xl border border-amber-200 bg-white/90 p-3">
                <p className="text-[11px] font-bold text-amber-900">Month-End Ledger Argument:</p>
                <p className="text-xs text-amber-800">
                  Vendor Diary: "31 days × ₹68 = ₹2,108"<br />
                  Customer: "Par hum 4 din Pune me the vacation pe!"
                </p>
              </div>
              <p className="text-[11px] font-semibold text-rose-800">
                ⚠️ Result: Crumpled paper notebook tallies, missing dates, and awkward payment calls.
              </p>
            </div>
          )}

          {activeTab === "security" && (
            <div className="my-auto space-y-2">
              <div className="rounded-xl border border-rose-200 bg-white/90 p-3">
                <p className="text-[11px] font-bold text-rose-900">Society Security Intercom:</p>
                <p className="text-xs text-rose-700">
                  "Madam Gate 2 se delivery boy aaya hai, OTP bolo please." (06:30 AM while sleeping)
                </p>
              </div>
              <p className="text-[11px] font-semibold text-rose-800">
                ⚠️ Result: Early morning intercom calls, unverified delivery staff wandering society towers.
              </p>
            </div>
          )}

          <div className="text-[10px] text-[#9B958B] flex items-center justify-between">
            <span>Manual paper logs</span>
            <span>Zero audit trail</span>
          </div>
        </div>

        {/* AFTER LAYER (Revealed by Slider) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden bg-white shadow-md border-r border-[#BD4B2A]/40 transition-[width] duration-75"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="absolute inset-0 w-full min-w-[340px] sm:min-w-[580px] p-5 flex flex-col justify-between bg-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                <Check size={12} />
                After · RUXS Impeccable Operating Layer
              </span>
              <span className="text-[10px] font-mono text-[#BD4B2A] font-bold">FSM Cutoff Locked</span>
            </div>

            {activeTab === "autopilot" && (
              <div className="my-auto space-y-2.5">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#5A554B]">A2 Gir Cow Milk · 1.5 Litres</p>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">₹102.00</span>
                  </div>
                  <p className="text-[11px] text-[#746E63] mt-1">
                    Doorstep Drop 06:14 AM · Flat 1402, Tower B · Gate Pre-Cleared
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Cutoff locked at 10:00 PM · Automatic Digital Khata debit · 0 morning messages needed.
                </div>
              </div>
            )}

            {activeTab === "khata" && (
              <div className="my-auto space-y-2.5">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#5A554B]">Digital Khata · October Statement</p>
                    <span className="text-xs font-mono font-bold text-emerald-700">₹1,836.00</span>
                  </div>
                  <p className="text-[11px] text-[#746E63] mt-1">
                    18 verified deliveries · 4 vacation pause days credited back · Exact Integer Paise
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  1-Tap NPCI UPI deep link · Zero arithmetic disputes · Roommate split ready.
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="my-auto space-y-2.5">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#5A554B]">Society Gate Pass #RUX-8821</p>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">Pre-Approved</span>
                  </div>
                  <p className="text-[11px] text-[#746E63] mt-1">
                    Driver Suresh K. · Floor 14 down to Floor 1 Elevator Cluster Route
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Zero intercom wakeup calls · Masked PII compliance · Safe gated community access.
                </div>
              </div>
            )}

            <div className="text-[10px] text-[#746E63] flex items-center justify-between">
              <span>Postgres & Neon Ledger</span>
              <span>100% Deterministic</span>
            </div>
          </div>
        </div>

        {/* Draggable Slider Seam Handle */}
        <div
          className="absolute inset-y-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="flex h-10 w-6 items-center justify-center rounded-md border border-[#BD4B2A]/50 bg-white shadow-md text-[#BD4B2A]">
            <span className="text-[10px] font-bold">⇄</span>
          </div>
        </div>

        {/* Invisible Input Range */}
        <input
          type="range"
          min="10"
          max="90"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          aria-label="Drag to compare before and after transformation"
        />
      </div>

      {/* Proof Footer Summary */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-[#746E63]">
        <span className="font-semibold">Slide to reveal the operating layer</span>
        <span className="font-mono text-[11px] font-bold text-[#BD4B2A]">
          {activeTab === "autopilot" && "Zero morning follow-up"}
          {activeTab === "khata" && "Exact integer Paise accuracy"}
          {activeTab === "security" && "Intercom-free pre-cleared access"}
        </span>
      </div>
    </div>
  );
}
