"use client";

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
  { href: "/customer/dashboard", label: "Overview", icon: Home },
  { href: "/customer/subscribe", label: "Services", icon: Settings },
  { href: "/customer/household", label: "Household", icon: Users },
  { href: "/customer/expenses", label: "Expenses", icon: Wallet },
];

export default function CustomerPortalNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-[252px] shrink-0 border-r border-white/[0.08] bg-[#0d100e] lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-white/[0.08] px-6">
          <Link href="/" aria-label="RUXS home">
            <BrandLogo priority className="w-[92px]" />
          </Link>
        </div>

        <div className="px-4 py-5">
          <div className="rounded-[22px] border border-primary/12 bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.08),transparent_55%),rgba(255,255,255,0.02)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">Personal space</span>
              <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold">Household operations</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Services, deliveries, Khata and flatmates in one calm workspace.
            </p>
          </div>
        </div>

        <nav className="px-3">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-subtle">Workspace</p>
          <div className="space-y-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    active
                      ? "group flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary"
                      : "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                  }
                >
                  <Icon size={16} className={active ? "text-primary" : "text-subtle"} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/[0.08] p-4">
          <Link href="/customer/subscribe" className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/[0.04] px-3.5 py-3 text-xs transition hover:bg-primary/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard size={15} />
              </div>
              <div>
                <p className="font-semibold">Add a service</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">Start a new recurring plan</p>
              </div>
            </div>
            <span className="text-primary">→</span>
          </Link>

          <Link href="/login" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground">
            <LogOut size={15} className="text-subtle" />
            Account & sign out
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0d0c]/90 backdrop-blur-xl lg:col-start-2">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">RUXS / household</p>
            <p className="mt-1 text-sm font-semibold">
              {items.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label || "Overview"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[9px] text-muted-foreground sm:flex">
              <Calendar size={12} />
              Sunday, 20 Sep
            </span>
            <Link
              href="/customer/dashboard"
              className="rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-semibold text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
            >
              My overview
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-white/[0.08] bg-[#0b0d0c]/95 px-2 backdrop-blur-xl lg:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "flex min-w-[70px] flex-col items-center gap-1 rounded-xl bg-primary/10 py-2 text-[9px] font-semibold text-primary"
                  : "flex min-w-[70px] flex-col items-center gap-1 py-2 text-[9px] font-medium text-muted-foreground"
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
