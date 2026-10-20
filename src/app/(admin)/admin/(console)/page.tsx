import Link from "next/link";
import { ArrowRight, ClipboardList, Plus, Repeat, Store, Undo2, Users, Wallet, Receipt } from "lucide-react";
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
    { label: "Active stores", value: String(o.vendors.active), sub: `${o.vendors.suspended} suspended`, href: "/admin/vendors", icon: Store },
    { label: "Households", value: String(o.households), sub: `${o.customers} connected customers`, href: "/admin/households", icon: Users },
    { label: "Active plans", value: String(o.activeSubs), sub: "Daily subscriptions", href: "/admin/vendors", icon: Repeat },
    { label: "Open app orders", value: String(o.openOrders), sub: `${o.ordersToday} for today`, href: "/admin/orders", icon: ClipboardList },
  ];

  const attention = [
    { show: b.pendingVendors > 0, text: `${b.pendingVendors} store ${b.pendingVendors === 1 ? "application" : "applications"} to review`, href: "/admin/vendors", icon: Store },
    { show: b.openPayouts > 0, text: `${b.openPayouts} withdrawal ${b.openPayouts === 1 ? "request" : "requests"} to pay`, href: "/admin/payouts", icon: Wallet },
    { show: b.refunds > 0, text: `${b.refunds} ${b.refunds === 1 ? "refund" : "refunds"} due to households`, href: "/admin/payouts", icon: Undo2 },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Platform overview</h1>
          <p className="mt-1 text-sm text-muted">Real-time marketplace metrics &amp; ledger health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/invoices" className="flex h-11 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-sm font-semibold shadow-2xs hover:bg-bg transition">
            <Receipt className="h-4 w-4" aria-hidden="true" /> Invoices
          </Link>
          <Link href="/admin/payouts" className="flex h-11 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-sm font-semibold shadow-2xs hover:bg-bg transition">
            <Wallet className="h-4 w-4" aria-hidden="true" /> Payouts
          </Link>
          <Link href="/admin/vendors/new" className="flex h-11 items-center gap-2 rounded-[12px] bg-accent px-4 text-sm font-bold text-white shadow-2xs hover:opacity-95 transition">
            <Plus className="h-4 w-4" aria-hidden="true" /> New vendor
          </Link>
        </div>
      </div>

      {/* Main Visual Client Dashboard with GMV breakdown and Category distribution */}
      <AdminOverviewClient data={o} />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="group rounded-[16px] border border-line bg-surface p-4 transition hover:border-ink/30 hover:shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <Icon className="h-4 w-4 text-muted group-hover:text-ink transition-colors" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink sm:text-3xl">{k.value}</p>
              <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Latest app orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-accent hover:underline">
              All orders →
            </Link>
          </div>
          {o.recent.length === 0 ? (
            <p className="rounded-[16px] border border-line bg-surface p-6 text-center text-sm text-muted">
              No app orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface shadow-2xs">
              {o.recent.map(({ order, vendorName }) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{vendorName}</p>
                    <p className="text-xs text-muted">
                      <span className="font-mono text-ink">{order.number}</span> · {timeFmt.format(new Date(order.createdAt))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-mono font-semibold tabular-nums text-ink">{formatINR(order.totalPaise)}</span>
                    <StatusPill status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Needs attention</h2>
          {attention.length === 0 ? (
            <p className="rounded-[16px] border border-line bg-surface p-5 text-sm text-muted shadow-2xs">
              All clear. No applications, withdrawals or refunds waiting.
            </p>
          ) : (
            <ul className="space-y-2">
              {attention.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.text}>
                    <Link
                      href={a.href}
                      className="flex items-center gap-3 rounded-[14px] border border-accent/30 bg-peach p-4 text-sm font-medium transition hover:border-accent shadow-2xs"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                      <span className="flex-1 text-ink">{a.text}</span>
                      <ArrowRight className="h-4 w-4 text-accent" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
