"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, ShieldCheck } from "lucide-react";

export function ImpeccableHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#5A554B]/10 bg-[#FFF8ED]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Mark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#BD4B2A] text-white shadow-xs group-hover:bg-[#A84224] transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M5 2.5 L13.5 2.5 L5.5 21.5 L5 21.5 Q2.5 21.5 2.5 19 L2.5 5 Q2.5 2.5 5 2.5 Z" />
              <path d="M16.5 2.5 L19 2.5 Q21.5 2.5 21.5 5 L21.5 19 Q21.5 21.5 19 21.5 L8.5 21.5 Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-tight text-[#5A554B]">
              RUXS<span className="text-[#BD4B2A]">.in</span>
            </span>
            <span className="text-[10px] font-semibold text-[#746E63] uppercase tracking-wider -mt-1">
              Society Operating Layer
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="#proof"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#5A554B] hover:bg-[#5A554B]/5 transition-colors"
          >
            Proof
          </Link>
          <Link
            href="#console"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#5A554B] hover:bg-[#5A554B]/5 transition-colors"
          >
            Routine Deck
          </Link>
          <Link
            href="#bento"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#5A554B] hover:bg-[#5A554B]/5 transition-colors"
          >
            Architecture
          </Link>
          <Link
            href="#testimonials"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#5A554B] hover:bg-[#5A554B]/5 transition-colors"
          >
            Societies
          </Link>
          <Link
            href="/vendor/onboard"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#5A554B] hover:bg-[#5A554B]/5 transition-colors"
          >
            For Merchants
          </Link>
        </nav>

        {/* Live Counter & Primary Action */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5A554B]/10 bg-white/80 px-3 py-1 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-[#5A554B] tracking-tight">
              4,200+ Flats Live
            </span>
          </div>

          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#BD4B2A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#A84224] transition-all hover:gap-2"
          >
            <span>Open App</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#5A554B]/15 bg-white text-[#5A554B] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#5A554B]/10 bg-[#FFF8ED] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="#proof"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#5A554B] hover:bg-white"
            >
              Proof & Transformation
            </Link>
            <Link
              href="#console"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#5A554B] hover:bg-white"
            >
              Routine Command Deck
            </Link>
            <Link
              href="#bento"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#5A554B] hover:bg-white"
            >
              System Architecture
            </Link>
            <Link
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#5A554B] hover:bg-white"
            >
              Resident Stories
            </Link>
            <Link
              href="/vendor/onboard"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#5A554B] hover:bg-white"
            >
              Vendor Partner Onboarding
            </Link>
            <div className="pt-2">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#BD4B2A] py-2.5 text-sm font-bold text-white shadow-xs"
              >
                <span>Launch RUXS App</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
