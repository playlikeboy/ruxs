"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CreditCard,
  Home,
  LogOut,
  Settings,
  Users,
  Wallet,
} from "@/components/icons/animated";
import { BrandLogo } from "@/components/brand/BrandLogo";

const items = [
  { href: "/app", label: "App", icon: Home },
  { href: "/customer/subscribe", label: "Services", icon: Settings },
  { href: "/customer/household", label: "Household", icon: Users },
  { href: "/customer/expenses", label: "Expenses", icon: Wallet },
];

export default function CustomerPortalNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());

  return (
    <div className="min-h-screen bg-surface text-ink font-sans">
      <div className="flex min-h-screen">
        <aside className="hidden w-[252px] shrink-0 border-r border-border bg-surface-raised lg:flex lg:flex-col shadow-xs">
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/" aria-label="RUXS home">
              <BrandLogo variant="light" priority className="w-[92px]" />
            </Link>
          </div>
          <div className="px-4 py-5">
            <div className="rounded-2xl border border-coral/25 bg-coral/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-action">Personal space</span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#2E7D32]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                  Live
                </span>
              </div>
              <p className="mt-3 text-sm font-bold font-display">Household Operations</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-muted">Services, deliveries, Khata and flatmates in one calm workspace.</p>
            </div>
          </div>
          <nav className="px-3">
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-ink-muted">Workspace</p>
            <div className="space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={active ? "group flex items-center gap-3 rounded-xl bg-coral/15 px-3 py-2.5 text-xs font-bold text-action" : "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-ink-muted transition hover:bg-surface-band hover:text-ink font-semibold"}
                  >
                    <Icon size={16} className={active ? "text-action" : "text-ink-muted"} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="mt-auto space-y-2 border-t border-border p-4">
            <Link href="/customer/subscribe" className="flex items-center justify-between rounded-2xl border border-coral/20 bg-surface-band px-3.5 py-3 text-xs transition hover:bg-surface-subtle">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral/15 text-action"><CreditCard size={15} /></div>
                <div>
                  <p className="font-bold text-ink">Add a service</p>
                  <p className="mt-0.5 text-[9px] text-ink-muted">Start a new recurring plan</p>
                </div>
              </div>
              <span className="text-action font-bold">→</span>
            </Link>
            <Link href="/login" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] text-ink-muted transition hover:bg-surface-band hover:text-ink font-semibold">
              <LogOut size={15} className="text-ink-muted" />
              Account & sign out
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-border bg-surface-raised/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-coral">RUXS / household</p>
                <p className="mt-1 text-sm font-bold font-display">{items.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label || "Overview"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-band px-2.5 py-1 text-[9px] text-ink-muted sm:flex font-semibold">
                  <Calendar size={12} />
                  {today}
                </span>
                <Link href="/app" className="rounded-full border border-border bg-surface-raised px-3.5 py-1.5 text-[11px] font-bold text-ink transition hover:bg-surface-band shadow-xs">App Home</Link>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-64px)] pb-20 lg:pb-8">{children}</main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-border bg-surface-raised/95 px-2 backdrop-blur-xl lg:hidden shadow-card">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={active ? "flex min-w-[70px] flex-col items-center gap-1 rounded-xl bg-coral/15 py-2 text-[9px] font-bold text-action" : "flex min-w-[70px] flex-col items-center gap-1 py-2 text-[9px] font-semibold text-ink-muted"}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
