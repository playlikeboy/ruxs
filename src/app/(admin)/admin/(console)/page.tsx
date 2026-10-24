import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Plus,
  Repeat,
  Store,
  Undo2,
  Users,
  Wallet,
  Receipt,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatINR } from "@/core/money";
import { getAdminBadges, getAdminOverview } from "@/features/admin/queries";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { AdminOverviewClient } from "@/features/admin/components/admin-overview-client";

export const metadata = { title: "Overview · Admin" };

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminOverviewPage() {
  const [o, b] = await Promise.all([getAdminOverview(), getAdminBadges()]);

  const kpis = [
    {
      label: "Active stores",
      value: String(o.vendors.active),
      sub: `${o.vendors.suspended} suspended · ${o.vendors.pending} pending`,
      href: "/admin/vendors",
      icon: Store,
    },
    {
      label: "Households",
      value: String(o.households),
      sub: `${o.customers} consumer connections`,
      href: "/admin/households",
      icon: Users,
    },
    {
      label: "Active plans",
      value: String(o.activeSubs),
      sub: "Daily recurring subscriptions",
      href: "/admin/vendors",
      icon: Repeat,
    },
    {
      label: "Open app orders",
      value: String(o.openOrders),
      sub: `${o.ordersToday} scheduled today`,
      href: "/admin/orders",
      icon: ClipboardList,
    },
  ];

  const attention = [
    {
      show: b.pendingVendors > 0,
      text: `${b.pendingVendors} store ${b.pendingVendors === 1 ? "application" : "applications"} waiting for review`,
      href: "/admin/vendors?status=pending",
      icon: Store,
      badge: "Pending Approval",
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
    },
    {
      show: b.openPayouts > 0,
      text: `${b.openPayouts} withdrawal ${b.openPayouts === 1 ? "request" : "requests"} ready for disbursement`,
      href: "/admin/payouts",
      icon: Wallet,
      badge: "Action Required",
      tone: "border-accent/30 bg-accent/10 text-ink",
    },
    {
      show: b.refunds > 0,
      text: `${b.refunds} customer ${b.refunds === 1 ? "refund" : "refunds"} due to households`,
      href: "/admin/payouts",
      icon: Undo2,
      badge: "Refund Queue",
      tone: "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200",
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Platform Command Center
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Live marketplace overview, gross volumes, and real-time ledger health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/invoices"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 text-xs font-semibold shadow-2xs hover:bg-bg transition"
          >
            <Receipt className="h-4 w-4" aria-hidden="true" />
            <span>Invoices</span>
          </Link>
          <Link
            href="/admin/payouts"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 text-xs font-semibold shadow-2xs hover:bg-bg transition"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span>Payouts</span>
            {b.openPayouts > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.2 text-[10px] font-bold text-white tabular-nums">
                {b.openPayouts}
              </span>
            )}
          </Link>
          <Link
            href="/admin/vendors/new"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-accent px-4 text-xs font-bold text-white shadow-2xs hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Vendor</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Summary Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="group rounded-[16px] border border-line bg-surface p-4 transition hover:border-ink/40 hover:shadow-2xs"
            >
              <div className="flex items-center justify-between text-muted">
                <p className="text-xs font-medium">{k.label}</p>
                <Icon className="h-4 w-4 text-muted group-hover:text-accent transition-colors" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                {k.value}
              </p>
              <p className="mt-0.5 text-xs text-muted truncate">{k.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Main Visual Client Dashboard with GMV breakdown and Category distribution */}
      <AdminOverviewClient data={o} />

      {/* Feed & Action Items Section */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Latest Orders Stream */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                Latest App Orders
              </h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-accent hover:underline">
              All orders ({o.openOrders} open) →
            </Link>
          </div>

          {o.recent.length === 0 ? (
            <p className="rounded-[16px] border border-line bg-surface p-8 text-center text-sm text-muted">
              No app orders recorded yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-2xs">
              <ul className="divide-y divide-line">
                {o.recent.map(({ order, vendorName }) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm transition hover:bg-bg/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-ink text-xs sm:text-sm">
                          {vendorName}
                        </p>
                        <span className="font-mono text-[11px] text-muted rounded bg-bg px-1.5 py-0.5">
                          {order.number}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        {timeFmt.format(new Date(order.createdAt))}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-ink">
                        {formatINR(order.totalPaise)}
                      </span>
                      <StatusPill status={order.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Action Center / Needs Attention */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Action Required
            </h2>
          </div>

          {attention.length === 0 ? (
            <div className="rounded-[16px] border border-line bg-surface p-5 text-center text-xs text-muted shadow-2xs space-y-1">
              <p className="font-semibold text-ink">All operational queues clear</p>
              <p>No vendor applications, pending withdrawals, or refund tickets waiting.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {attention.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.text}>
                    <Link
                      href={a.href}
                      className={
                        "flex items-start gap-3 rounded-[14px] border p-4 text-xs font-medium transition hover:shadow-2xs " +
                        a.tone
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0 mt-0.5 text-accent" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-ink mb-0.5 text-xs">
                          {a.badge}
                        </span>
                        <span className="text-muted leading-relaxed">{a.text}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-accent mt-1" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Quick Admin Links Card */}
          <div className="rounded-[16px] border border-line bg-surface p-4 space-y-2 shadow-2xs text-xs">
            <h3 className="font-bold text-ink text-xs uppercase tracking-wider">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/admin/vendors/new"
                className="flex items-center gap-1.5 rounded-[8px] bg-bg p-2 text-ink hover:bg-accent/10 hover:text-accent transition font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Add Store
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-1.5 rounded-[8px] bg-bg p-2 text-ink hover:bg-accent/10 hover:text-accent transition font-medium"
              >
                <Store className="h-3.5 w-3.5" /> Categories
              </Link>
              <Link
                href="/admin/payouts"
                className="flex items-center gap-1.5 rounded-[8px] bg-bg p-2 text-ink hover:bg-accent/10 hover:text-accent transition font-medium"
              >
                <Wallet className="h-3.5 w-3.5" /> Payout Runs
              </Link>
              <Link
                href="/admin/tickets"
                className="flex items-center gap-1.5 rounded-[8px] bg-bg p-2 text-ink hover:bg-accent/10 hover:text-accent transition font-medium"
              >
                <Undo2 className="h-3.5 w-3.5" /> Disputes
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
