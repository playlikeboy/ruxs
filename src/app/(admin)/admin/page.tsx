import Link from "next/link";
import { formatINR } from "@/core/money";
import { getAdminOverview } from "@/features/admin/queries";
import { StatusPill } from "@/features/consumer/components/status-pill";

export const metadata = { title: "Overview" };

const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();
  const stats = [
    { label: "Active vendors", value: o.vendors.active, href: "/admin/vendors" },
    { label: "Pending approval", value: o.vendors.pending, href: "/admin/vendors", tone: o.vendors.pending ? "text-warn" : "" },
    { label: "App households", value: o.households, href: "/admin/households" },
    { label: "All customers", value: o.customers },
    { label: "Active plans", value: o.activeSubs },
    { label: "Open orders", value: o.openOrders, href: "/admin/orders?status=placed", tone: o.openOrders ? "text-accent" : "" },
    { label: "Orders for today", value: o.ordersToday, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-sm text-muted">Everything across RUXS, live from the database.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/vendors/new" className="rounded-[10px] bg-accent px-3.5 py-2 text-sm font-bold text-white">+ New vendor</Link>
          <Link href="/admin/payouts" className="rounded-[10px] border border-line bg-surface px-3.5 py-2 text-sm font-semibold">Payouts</Link>
          <Link href="/admin/settings" className="rounded-[10px] border border-line bg-surface px-3.5 py-2 text-sm font-semibold">Categories &amp; settings</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[14px] bg-ink p-5 text-white">
          <p className="text-xs uppercase tracking-wider opacity-70">App orders delivered · 30 days</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{formatINR(o.shopValuePaise)}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Plan deliveries billed · 30 days</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{formatINR(o.planValuePaise)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-xs text-muted">{s.label}</p>
              <p className={"mt-1 font-mono text-2xl font-bold tabular-nums " + (s.tone ?? "")}>{s.value}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="rounded-[12px] border border-line bg-surface p-4 transition hover:border-ink">{body}</Link>
          ) : (
            <div key={s.label} className="rounded-[12px] border border-line bg-surface p-4">{body}</div>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Latest app orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-accent">All orders →</Link>
        </div>
        {o.recent.length === 0 ? (
          <p className="rounded-[12px] border border-line bg-surface p-6 text-center text-sm text-muted">No app orders yet.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface">
            {o.recent.map(({ order, vendorName }) => (
              <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{vendorName} · <span className="font-mono text-muted">{order.number}</span></p>
                  <p className="text-xs text-muted">{timeFmt.format(order.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono font-semibold tabular-nums">{formatINR(order.totalPaise)}</span>
                  <StatusPill status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
