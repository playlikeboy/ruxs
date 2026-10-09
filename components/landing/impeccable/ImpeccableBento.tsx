"use client";

import { 
  Clock, 
  Layers, 
  ShieldCheck, 
  CreditCard, 
  PackageCheck, 
  ArrowDown, 
  Lock, 
  FileCheck,
  CheckCircle2,
  TrendingDown,
  Sparkles
} from "lucide-react";

export function ImpeccableBento() {
  return (
    <section id="architecture" className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-[var(--c-border-subtle)] bg-[var(--c-canvas)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--c-accent-soft)] border border-[var(--c-accent-border)] text-[var(--c-accent)] text-xs font-semibold mb-4">
            <span className="cc-led cc-led--coral" />
            <span>DEEP RESIDENTIAL INFRASTRUCTURE</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[var(--c-text-primary)] tracking-tight">
            Engineered for High-Density Societies
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed">
            Standard delivery apps are designed for single-order motorbike dispatch. RUXS is engineered as an infrastructure layer for gated communities: batch logistics, zero noise, and mathematical billing.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Tile 1: 10:00 PM Cutoff Lock (Col 7) */}
          <div className="md:col-span-7 p-7 rounded-2xl bg-[var(--c-canvas-subtle)] border border-[var(--c-border-subtle)] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="ks-tag ks-tag--coral">STATE ENGINE</span>
                <span className="text-xs font-mono text-[var(--c-text-muted)]">CRON 22:00 IST</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[var(--c-text-primary)] mb-2">
                The 10:00 PM Immutable Cutoff Lock
              </h3>
              <p className="text-xs sm:text-sm text-[var(--c-text-secondary)] leading-relaxed mb-6">
                Most vendor disputes happen because of 11:30 PM WhatsApp cancellations. RUXS enforces a cryptographic cutoff at 22:00 IST. Subscriptions freeze, the society manifest is sealed, and vendors procure exact stock.
              </p>
            </div>

            {/* FSM Visualization */}
            <div className="p-4 rounded-xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--c-text-muted)]">Cutoff Pipeline:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="cc-led cc-led--emerald" /> Deterministic
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border-subtle)]">
                  <div className="text-[var(--c-text-muted)]">21:59 IST</div>
                  <div className="font-semibold text-[var(--c-text-primary)]">Mutable</div>
                </div>
                <div className="p-2 rounded-lg bg-coral-50 border border-coral-200 text-coral-800">
                  <div className="text-coral-600">22:00 IST</div>
                  <div className="font-semibold">FSM Locked</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <div className="text-emerald-600">05:30 IST</div>
                  <div className="font-semibold">Doorstep Run</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tile 2: Top-Down Elevator Efficiency (Col 5) */}
          <div className="md:col-span-5 p-7 rounded-2xl bg-[var(--c-canvas-subtle)] border border-[var(--c-border-subtle)] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="ks-tag ks-tag--emerald">LOGISTICS EFFICIENCY</span>
                <span className="text-xs font-mono text-[var(--c-text-muted)]">-72% ELEVATOR USE</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[var(--c-text-primary)] mb-2">
                Top-Down Elevator Routing
              </h3>
              <p className="text-xs sm:text-sm text-[var(--c-text-secondary)] leading-relaxed mb-6">
                Delivery boys take the lift once to the penthouse floor and walk down the stairwells floor by floor. Zero elevator congestion for residents heading to work.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--c-text-primary)]">Sequential Drop Run</div>
                <div className="text-[11px] text-[var(--c-text-muted)]">Floor 14 → 12 → 10 → 8 → 2 → G</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono text-emerald-700">18 Mins</div>
                <div className="text-[10px] text-[var(--c-text-muted)]">per 40 Flats</div>
              </div>
            </div>
          </div>

          {/* Tile 3: Integer Paise Khata (Col 4) */}
          <div className="md:col-span-4 p-6 rounded-2xl bg-[var(--c-canvas-subtle)] border border-[var(--c-border-subtle)] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] flex items-center justify-center text-[var(--c-accent)] mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="ks-tag ks-tag--amber">FINANCIAL AUDIT</span>
            </div>
            <h4 className="font-semibold text-base text-[var(--c-text-primary)] mb-2">
              Integer Paise Precision
            </h4>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              No JavaScript floating point errors. Every single subscription unit, deposit, and refund is computed authoritatively in integer paise (`paise = ₹ * 100`) backed by Neon PostgreSQL.
            </p>
          </div>

          {/* Tile 4: DPDP Act 2023 Masking (Col 4) */}
          <div className="md:col-span-4 p-6 rounded-2xl bg-[var(--c-canvas-subtle)] border border-[var(--c-border-subtle)] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] flex items-center justify-center text-emerald-600 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="ks-tag ks-tag--emerald">DPDP ACT 2023</span>
            </div>
            <h4 className="font-semibold text-base text-[var(--c-text-primary)] mb-2">
              Strict Gate & Doorstep Masking
            </h4>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              Delivery runners see only `Flat B-702` and delivery bag notes. Residents&apos; mobile numbers, emails, and family details are never exposed to ground staff or printed on bags.
            </p>
          </div>

          {/* Tile 5: Physical Asset Ledger (Col 4) */}
          <div className="md:col-span-4 p-6 rounded-2xl bg-[var(--c-canvas-subtle)] border border-[var(--c-border-subtle)] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] flex items-center justify-center text-coral-600 mb-4">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="ks-tag ks-tag--coral">ASSET INVENTORY</span>
            </div>
            <h4 className="font-semibold text-base text-[var(--c-text-primary)] mb-2">
              Bottles, Dabbas & Cans
            </h4>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              Empty glass milk bottles, 20L Bisleri cans, and stainless-steel tiffins are tracked on return. No missing deposit friction between tenants and local vendors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
