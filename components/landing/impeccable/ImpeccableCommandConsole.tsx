"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, ArrowRight } from "lucide-react";

type CommandId =
  | "milk_daily"
  | "water_20l"
  | "tiffin_lunch"
  | "morning_poll"
  | "cutoff_10pm"
  | "vacation_pause"
  | "khata_ledger"
  | "roommate_split"
  | "gate_pass"
  | "masked_pii";

interface CommandDetail {
  id: CommandId;
  group: "routine" | "control" | "settle" | "security";
  label: string;
  commandSyntax: string;
  title: string;
  description: string;
  outcome: string;
  tag: string;
}

const COMMANDS: Record<CommandId, CommandDetail> = {
  milk_daily: {
    id: "milk_daily",
    group: "routine",
    label: "milk_daily",
    commandSyntax: "/ruxs routine subscribe --item cow_milk_1.5L --cadence daily --time 06:30",
    title: "Daily Doorstep Milk Routine",
    description: "Configures recurring farm milk drops at your apartment doorstep before 07:00 AM with zero daily follow-ups.",
    outcome: "✓ Fulfillments scheduled daily · Neon PostgreSQL sync · Gate pass pre-cleared",
    tag: "Autopilot",
  },
  water_20l: {
    id: "water_20l",
    group: "routine",
    label: "water_20l",
    commandSyntax: "/ruxs routine exchange --asset water_jar_20L --canCount 2",
    title: "Doorstep 20L Water Can Exchange",
    description: "Replaces empty jars automatically when placed outside the door. Physical asset holding balance tracks collections and deliveries.",
    outcome: "✓ Old cans: 2 collected · New cans: 2 delivered · Zero lost deposit balance",
    tag: "Asset Ledger",
  },
  tiffin_lunch: {
    id: "tiffin_lunch",
    group: "routine",
    label: "tiffin_lunch",
    commandSyntax: "/ruxs routine meals --plan home_lunch --weekdays true --pureVeg true",
    title: "Homestyle Tiffin Routine (Mon-Fri)",
    description: "Healthy home cooked lunch boxes delivered hot to your flat between 12:30 PM and 1:15 PM.",
    outcome: "✓ Weekdays-only schedule · Weekend automatically skipped · Kitchen batch updated",
    tag: "FSM Cadence",
  },
  morning_poll: {
    id: "morning_poll",
    group: "control",
    label: "morning_poll",
    commandSyntax: "/ruxs poll dispatch --shift morning --cutoff 22:00",
    title: "Automated WhatsApp Morning Poll",
    description: "Dispatches 2-button interactive WhatsApp template (Deliver Today / Skip Today). 1-tap updates the fulfillment state machine directly.",
    outcome: "✓ Interactive reply parsed · Zero typing required · Quiet hours enforced",
    tag: "WhatsApp Gateway",
  },
  cutoff_10pm: {
    id: "cutoff_10pm",
    group: "control",
    label: "cutoff_10pm",
    commandSyntax: "/ruxs cutoff lock --date tomorrow --time 22:00",
    title: "Deterministic 10:00 PM Cutoff Lock",
    description: "Locks all tomorrow's orders at 10 PM sharp, preventing food wastage and giving vendors final batch counts before night prep.",
    outcome: "✓ Fulfillments state -> LOCKED · Kitchen counter generated · Zero ghost orders",
    tag: "FSM Engine",
  },
  vacation_pause: {
    id: "vacation_pause",
    group: "control",
    label: "vacation_pause",
    commandSyntax: "/ruxs vacation set --from 2026-10-14 --to 2026-10-20",
    title: "1-Tap Multi-Service Vacation Pause",
    description: "Pauses milk, water, tiffin, and newspapers simultaneously. Services resume automatically on your return date.",
    outcome: "✓ 7 days suppressed · 0 paise billed · Early resumption supported via 1-tap",
    tag: "DPDP Vacation",
  },
  khata_ledger: {
    id: "khata_ledger",
    group: "settle",
    label: "khata_ledger",
    commandSyntax: "/ruxs khata statement --month current --currency paise",
    title: "Immutable Digital Khata Ledger",
    description: "Banking-grade running balance calculated in integer Paise. Strictly separates monthly periods and prevents duplicates.",
    outcome: "✓ Running balance authoritative · Atomically signed · NPCI UPI deep link ready",
    tag: "Integer Paise",
  },
  roommate_split: {
    id: "roommate_split",
    group: "settle",
    label: "roommate_split",
    commandSyntax: "/ruxs expenses split --invoice inv_oct_4920 --members 3",
    title: "Household Expense Split (Zero Lost Penny)",
    description: "Splits indivisible invoice amounts across roommates down to the exact integer Paise, generating instant UPI deep links for each person.",
    outcome: "✓ Exact integer Paise allocation · Zero rounding leakage · P2P UPI links",
    tag: "Fair Split",
  },
  gate_pass: {
    id: "gate_pass",
    group: "security",
    label: "gate_pass",
    commandSyntax: "/ruxs gate verify --society 'Sobha Classic' --vendor 'Gowda Dairy'",
    title: "Geofenced Society Gate Pass",
    description: "Provides verified vendor QR credentials pre-cleared by RWA management, enabling elevator access without morning intercom calls.",
    outcome: "✓ Society geofence verified · Flat hierarchy linked · Gate intercom silenced",
    tag: "RWA Protocol",
  },
  masked_pii: {
    id: "masked_pii",
    group: "security",
    label: "masked_pii",
    commandSyntax: "/ruxs security mask --role DELIVERY_STAFF --scope stops",
    title: "India DPDP Act 2023 PII Masking",
    description: "Restricts delivery driver visibility to masked customer phone numbers (+91 98*****10) to prevent telephone harvesting and abuse.",
    outcome: "✓ DPDP 2023 compliant · Resident phone masked · Verification digits preserved",
    tag: "DPDP 2023",
  },
};

export function ImpeccableCommandConsole() {
  const [selectedCmd, setSelectedCmd] = useState<CommandId>("milk_daily");
  const [copied, setCopied] = useState(false);

  const active = COMMANDS[selectedCmd];

  const handleCopy = () => {
    navigator.clipboard.writeText(active.commandSyntax);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 sm:py-24 border-b border-[#5A554B]/10 bg-white" id="console">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="ks-tag">Interactive Deck</span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-[#5A554B] tracking-tight">
              The RUXS Routine Command Deck
            </h2>
          </div>
          <p className="text-sm text-[#746E63] max-w-md">
            Click any command key below to inspect the deterministic behavior, FSM state machine transitions, and database outcomes.
          </p>
        </div>

        {/* Readout Display Box */}
        <div className="rounded-2xl border border-[#5A554B]/14 bg-[#FFF8ED] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#5A554B]/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="cc-led is-active" />
              <h3 className="font-display text-lg font-extrabold text-[#5A554B]">
                {active.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="ks-tag">{active.group}</span>
              <span className="ks-tag bg-emerald-100 text-emerald-800 border-emerald-200">
                {active.tag}
              </span>
            </div>
          </div>

          {/* Interactive Code Line */}
          <div className="my-4 flex items-center justify-between gap-3 rounded-xl border border-[#5A554B]/15 bg-white px-4 py-3 font-mono text-xs text-[#5A554B] shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-[#BD4B2A] font-bold select-none">›</span>
              <span className="text-[#BD4B2A] font-bold">{active.commandSyntax.split(" ")[0]}</span>
              <span className="text-[#5A554B]">{active.commandSyntax.split(" ").slice(1).join(" ")}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#746E63] hover:text-[#5A554B] transition-colors"
              aria-label="Copy command"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <p className="text-sm text-[#746E63] leading-relaxed">
            {active.description}
          </p>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 font-mono text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <span>{active.outcome}</span>
          </div>
        </div>

        {/* Command Deck Keys Grouped by Function */}
        <div className="mt-8 rounded-2xl border border-[#5A554B]/12 bg-[#FFF8ED]/50 p-5 sm:p-6">
          <p className="text-xs font-bold text-[#746E63] uppercase tracking-wider mb-4">
            Select a routine command to test:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Group: Routine */}
            <div>
              <span className="text-[11px] font-mono font-bold text-[#BD4B2A] uppercase tracking-wider block mb-2">
                01 · Routine
              </span>
              <div className="flex flex-col gap-1.5">
                {(["milk_daily", "water_20l", "tiffin_lunch"] as CommandId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCmd(id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all ${
                      selectedCmd === id
                        ? "border-[#BD4B2A] bg-white text-[#BD4B2A] shadow-xs font-bold"
                        : "border-[#5A554B]/10 bg-white/60 text-[#5A554B] hover:bg-white"
                    }`}
                  >
                    <span>{COMMANDS[id].label}</span>
                    <span className={`cc-led ${selectedCmd === id ? "is-coral" : ""}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Group: Control */}
            <div>
              <span className="text-[11px] font-mono font-bold text-[#BD4B2A] uppercase tracking-wider block mb-2">
                02 · Control
              </span>
              <div className="flex flex-col gap-1.5">
                {(["morning_poll", "cutoff_10pm", "vacation_pause"] as CommandId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCmd(id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all ${
                      selectedCmd === id
                        ? "border-[#BD4B2A] bg-white text-[#BD4B2A] shadow-xs font-bold"
                        : "border-[#5A554B]/10 bg-white/60 text-[#5A554B] hover:bg-white"
                    }`}
                  >
                    <span>{COMMANDS[id].label}</span>
                    <span className={`cc-led ${selectedCmd === id ? "is-coral" : ""}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Group: Settle */}
            <div>
              <span className="text-[11px] font-mono font-bold text-[#BD4B2A] uppercase tracking-wider block mb-2">
                03 · Settle
              </span>
              <div className="flex flex-col gap-1.5">
                {(["khata_ledger", "roommate_split"] as CommandId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCmd(id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all ${
                      selectedCmd === id
                        ? "border-[#BD4B2A] bg-white text-[#BD4B2A] shadow-xs font-bold"
                        : "border-[#5A554B]/10 bg-white/60 text-[#5A554B] hover:bg-white"
                    }`}
                  >
                    <span>{COMMANDS[id].label}</span>
                    <span className={`cc-led ${selectedCmd === id ? "is-coral" : ""}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Group: Security */}
            <div>
              <span className="text-[11px] font-mono font-bold text-[#BD4B2A] uppercase tracking-wider block mb-2">
                04 · Security & Gate
              </span>
              <div className="flex flex-col gap-1.5">
                {(["gate_pass", "masked_pii"] as CommandId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCmd(id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all ${
                      selectedCmd === id
                        ? "border-[#BD4B2A] bg-white text-[#BD4B2A] shadow-xs font-bold"
                        : "border-[#5A554B]/10 bg-white/60 text-[#5A554B] hover:bg-white"
                    }`}
                  >
                    <span>{COMMANDS[id].label}</span>
                    <span className={`cc-led ${selectedCmd === id ? "is-coral" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
