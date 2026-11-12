import { Hint } from "@/components/ui/hint";
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
  LifeBuoy,
  Settings,
} from "lucide-react";
import { formatINR } from "@/core/money";
import { getAdminBadges, getAdminOverview } from "@/features/admin/queries";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { AdminOverviewClient } from "@/features/admin/components/admin-overview-client";

export const metadata = { title: "Overview" };

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
      badge: "Pending approval",
      tone: "border-warn/25 bg-brand-butter",
    },
    {
      show: b.openPayouts > 0,
      text: `${b.openPayouts} withdrawal ${b.openPayouts === 1 ? "request" : "requests"} ready for disbursement`,
      href: "/admin/payouts",
      icon: Wallet,
      badge: "Withdrawals",
      tone: "border-accent/25 bg-brand-peach",
    },
    {
      show: b.refunds > 0,
      text: `${b.refunds} customer ${b.refunds === 1 ? "refund" : "refunds"} due to households`,
      href: "/admin/payouts",
      icon: Undo2,
      badge: "Refunds due",
      tone: "border-bad/25 bg-bad/5",
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Hint id="admin-overview">
        New merchants apply at /apply and show up under Applications. Call them, add notes, then approve to create the store and its login.
      </Hint>
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Platform overview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Stores, households, order volume and the queues that need action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/invoices"
            className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-3.5 text-xs font-semibold text-ink transition hover:bg-bg"
          >
            <Receipt className="h-4 w-4" aria-hidden="true" />
            <span>Invoices</span>
          </Link>
          <Link
            href="/admin/payouts"
            className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-3.5 text-xs font-semibold text-ink transition hover:bg-bg"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span>Payouts</span>
            {b.openPayouts > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-white tabular-nums">
                {b.openPayouts}
                <span className="sr-only"> open</span>
              </span>
            )}
          </Link>
          <Link
            href="/admin/vendors/new"
            className="flex h-10 items-center gap-2 rounded-control bg-accent px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New vendor</span>
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
              className="group rounded-card border border-line bg-surface p-4 transition hover:border-ink/40"
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
              <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                Latest App Orders
              </h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-accent hover:underline">
              All orders ({o.openOrders} open)
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {o.recent.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-8 text-center text-sm text-muted">
              No app orders recorded yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              <ul className="divide-y divide-line">
                {o.recent.map(({ order, vendorName }) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm"
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
            <AlertTriangle className="h-4 w-4 text-warn" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Needs action
            </h2>
          </div>

          {attention.length === 0 ? (
            <div className="space-y-1 rounded-card border border-line bg-surface p-5 text-center text-xs text-muted">
              <p className="font-semibold text-ink">Nothing waiting</p>
              <p>No store applications, withdrawal requests or refunds need action.</p>
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
                        "flex items-start gap-3 rounded-control border p-4 text-xs font-medium transition hover:border-ink/30 " +
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

          {/* Quick admin links */}
          <nav aria-labelledby="admin-shortcuts" className="space-y-2 rounded-card border border-line bg-surface p-4 text-xs">
            <h3 id="admin-shortcuts" className="text-xs font-bold uppercase tracking-wider text-ink">
              Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/admin/vendors/new"
                className="flex items-center gap-1.5 rounded-control bg-bg p-2 font-medium text-ink transition hover:bg-accent/10 hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add store
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-1.5 rounded-control bg-bg p-2 font-medium text-ink transition hover:bg-accent/10 hover:text-accent"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" /> Categories
              </Link>
              <Link
                href="/admin/payouts"
                className="flex items-center gap-1.5 rounded-control bg-bg p-2 font-medium text-ink transition hover:bg-accent/10 hover:text-accent"
              >
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Payouts
              </Link>
              <Link
                href="/admin/tickets"
                className="flex items-center gap-1.5 rounded-control bg-bg p-2 font-medium text-ink transition hover:bg-accent/10 hover:text-accent"
              >
                <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" /> Tickets
              </Link>
            </div>
          </nav>
        </section>
      </div>
    </div>
  );
}
