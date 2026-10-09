import Link from "next/link";
import { ShieldCheck, Heart, Sparkles, Building2, Terminal } from "lucide-react";

export function ImpeccableFooter() {
  return (
    <footer className="border-t border-[var(--c-border-subtle)] bg-[var(--c-canvas)] text-xs text-[var(--c-text-secondary)]">
      {/* Live System Status Ticker */}
      <div className="border-b border-[var(--c-border-subtle)] bg-[var(--c-surface)]/60 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="cc-led cc-led--emerald" />
            <span className="text-[var(--c-text-primary)] font-semibold">ALL SOCIETY GATEWAYS OPERATIONAL</span>
            <span className="text-[var(--c-text-muted)]">· IST 10:00 PM Manifest Cutoff Active</span>
          </div>
          <div className="flex items-center gap-4 text-[var(--c-text-muted)]">
            <span>Neon DB: Connected</span>
            <span>·</span>
            <span>Cloudflare Edge: Active</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">99.98% On-Time Drops</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand & Mission (Col 2 on md) */}
        <div className="col-span-2 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-[var(--c-accent)] text-white font-serif font-bold text-base flex items-center justify-center shadow-xs">
              R
            </span>
            <span className="font-serif font-bold text-xl tracking-tight text-[var(--c-text-primary)]">
              RUXS
            </span>
          </Link>
          <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed max-w-sm">
            The quiet operating layer for recurring daily services in apartment societies. 1-tap fresh milk, 20L water cans, homestyle tiffins, morning puja flowers, pet care, steam iron passes, and transparent digital Khata.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] text-[var(--c-text-muted)]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DPDP Act 2023 Compliant · Zero Ads · Zero Spam</span>
          </div>
        </div>

        {/* Column: Platform */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[var(--c-text-primary)] text-xs uppercase tracking-wider">
            Platform
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                Resident Web App
              </Link>
            </li>
            <li>
              <Link href="/vendor/login" className="hover:text-[var(--c-text-primary)] transition-colors">
                Vendor Console
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-[var(--c-text-primary)] transition-colors">
                RWA Admin Portal
              </Link>
            </li>
            <li>
              <Link href="/app/khata" className="hover:text-[var(--c-text-primary)] transition-colors">
                Digital Khata Ledger
              </Link>
            </li>
            <li>
              <Link href="/app/vacation" className="hover:text-[var(--c-text-primary)] transition-colors">
                Vacation Pause Mode
              </Link>
            </li>
          </ul>
        </div>

        {/* Column: Services */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[var(--c-text-primary)] text-xs uppercase tracking-wider">
            Services
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                Fresh Farm Milk (500ml/1L)
              </Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                20L Bisleri Water Cans
              </Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                Homestyle Daily Tiffins
              </Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                Morning Puja Flowers
              </Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                Steam Iron Passes
              </Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-[var(--c-text-primary)] transition-colors">
                Pet Walking Routine
              </Link>
            </li>
          </ul>
        </div>

        {/* Column: Legal & Societies */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[var(--c-text-primary)] text-xs uppercase tracking-wider">
            Societies & Trust
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="hover:text-[var(--c-text-primary)] transition-colors">
                Privacy Policy (DPDP)
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[var(--c-text-primary)] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-[var(--c-text-primary)] transition-colors">
                Frequently Answered
              </Link>
            </li>
            <li>
              <a href="mailto:support@ruxs.in" className="hover:text-[var(--c-text-primary)] transition-colors">
                support@ruxs.in
              </a>
            </li>
            <li>
              <span className="text-[11px] text-[var(--c-text-muted)]">
                Bengaluru · Gurugram · Pune · Mumbai
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--c-border-subtle)] px-4 sm:px-8 py-6 bg-[var(--c-surface)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--c-text-muted)]">
          <div>
            © {new Date().getFullYear()} RUXS Technologies Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-1 font-serif text-[var(--c-text-secondary)]">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-coral-500 fill-coral-500 inline" />
            <span>for quiet morning apartment life.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
