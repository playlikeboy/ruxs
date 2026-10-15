import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, ClipboardList, Plus, Repeat, Store, Undo2, Users, Wallet } from "lucide-react";
import { formatINR } from "@/core/money";
import { getAdminBadges, getAdminOverview } from "@/features/admin/queries";
import { StatusPill } from "@/features/consumer/components/status-pill";

export const metadata = { title: "Overview" };

const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminOverviewPage() {
  const [o, b] = await Promise.all([getAdminOverview(), getAdminBadges()]);

  const kpis = [
    { label: "Active stores", value: String(o.vendors.active), sub: `${o.vendors.suspended} suspended`, href: "/admin/vendors", icon: Store },
    { label: "Households", value: String(o.households), sub: `${o.customers} customers in total`, href: "/admin/households", icon: Users },
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Platform overview</h1>
          <p className="mt-1 text-sm text-muted">Live from the database.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/payouts" className="flex h-11 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-sm font-semibold">
            <Wallet className="h-4 w-4" aria-hidden="true" /> Payouts
          </Link>
          <Link href="/admin/vendors/new" className="flex h-11 items-center gap-2 rounded-[12px] bg-accent px-4 text-sm font-bold text-white">
            <Plus className="h-4 w-4" aria-hidden="true" /> New vendor
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[16px] bg-ink p-5 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider opacity-70">App orders delivered · 30 days</p>
            <BadgeIndianRupee className="h-5 w-5 opacity-70" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums sm:text-4xl">{formatINR(o.shopValuePaise)}</p>
        </div>
        <div className="rounded-[16px] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted">Plan deliveries billed · 30 days</p>
            <Repeat className="h-5 w-5 text-muted" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums sm:text-4xl">{formatINR(o.planValuePaise)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.label} href={k.href} className="group rounded-[16px] border border-line bg-surface p-4 transition hover:border-ink/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <Icon className="h-4 w-4 text-muted group-hover:text-ink" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums sm:text-3xl">{k.value}</p>
              <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest app orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-accent">All orders →</Link>
          </div>
          {o.recent.length === 0 ? (
            <p className="rounded-[16px] border border-line bg-surface p-6 text-center text-sm text-muted">No app orders yet.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface">
              {o.recent.map(({ order, vendorName }) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{vendorName}</p>
                    <p className="text-xs text-muted"><span className="font-mono">{order.number}</span> · {timeFmt.format(order.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-mono font-semibold tabular-nums">{formatINR(order.totalPaise)}</span>
                    <StatusPill status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          {attention.length === 0 ? (
            <p className="rounded-[16px] border border-line bg-surface p-5 text-sm text-muted">All clear. No applications, withdrawals or refunds waiting.</p>
          ) : (
            <ul className="space-y-2">
              {attention.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.text}>
                    <Link href={a.href} className="flex items-center gap-3 rounded-[14px] border border-accent/30 bg-peach p-4 text-sm font-medium transition hover:border-accent">
                      <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                      <span className="flex-1">{a.text}</span>
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
