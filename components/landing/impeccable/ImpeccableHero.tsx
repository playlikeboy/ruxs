"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ImpeccableHeroProof } from "./ImpeccableHeroProof";

export function ImpeccableHero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-24 border-b border-[#5A554B]/10">
      {/* Background Subtle Paper Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#5A554B_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-6 flex flex-col items-start">
            {/* Status Kicker with Glowing LED */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5A554B]/15 bg-white px-3.5 py-1 shadow-2xs mb-6">
              <span className="cc-led is-coral" />
              <span className="font-mono text-[11px] font-bold text-[#5A554B] tracking-wide uppercase">
                India's Gated Society Protocol
              </span>
            </div>

            {/* Impeccable Display Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.08] tracking-tight text-[#5A554B]">
              The missing operating layer for{" "}
              <span className="relative inline-block text-[#BD4B2A]">
                apartment routines
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#FF804E]/40 rounded-full" />
              </span>
              .
            </h1>

            {/* Anti-Slop Subcopy */}
            <p className="mt-5 text-base sm:text-lg text-[#746E63] leading-relaxed max-w-xl font-normal">
              Fresh farm milk, 20L water cans, daily tiffins, morning flowers, and pet care delivered to your door before 07:00 AM. Zero WhatsApp chaos, zero crumpled diary tallies, and zero gate intercom calls.
            </p>

            {/* Primary & Ghost Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <Link
                href="/app"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#BD4B2A] px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#A84224] transition-all hover:gap-3"
              >
                <span>Launch RUXS App</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="#console"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[#5A554B]/20 bg-white px-6 py-3.5 text-sm font-bold text-[#5A554B] hover:bg-[#FFF8ED] transition-colors"
              >
                <span>Explore Routine Deck</span>
              </Link>
            </div>

            {/* Society Harness Logos / Trust Banner */}
            <div className="mt-10 pt-6 border-t border-[#5A554B]/10 w-full">
              <p className="text-[11px] font-mono font-semibold text-[#746E63] uppercase tracking-wider mb-3">
                Pre-cleared across gated communities
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[#5A554B]">
                <span className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-md border border-[#5A554B]/10">
                  <ShieldCheck size={14} className="text-[#BD4B2A]" />
                  Sobha Classic
                </span>
                <span className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-md border border-[#5A554B]/10">
                  <ShieldCheck size={14} className="text-[#BD4B2A]" />
                  Purva Fairmont
                </span>
                <span className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-md border border-[#5A554B]/10">
                  <ShieldCheck size={14} className="text-[#BD4B2A]" />
                  Prestige Lakeside
                </span>
                <span className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-md border border-[#5A554B]/10">
                  <ShieldCheck size={14} className="text-[#BD4B2A]" />
                  DLF Cybercity
                </span>
                <span className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-md border border-[#5A554B]/10">
                  <ShieldCheck size={14} className="text-[#BD4B2A]" />
                  Godrej Woods
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Proof Transformation */}
          <div className="lg:col-span-6 w-full" id="proof">
            <ImpeccableHeroProof />
          </div>
        </div>
      </div>
    </section>
  );
}
