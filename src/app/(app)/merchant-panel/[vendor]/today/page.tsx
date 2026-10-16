import Link from "next/link";
import { ArrowRight, BellRing, ChartColumn, Navigation, Package, Repeat, UtensilsCrossed, Wallet } from "lucide-react";
import { formatINR } from "@/core/money";
import { todayIST } from "@/core/time";
import { requireVendorAccess } from "@/lib/auth/session";
import { getVendorProducts } from "@/features/products/queries";
import { getTodayOrders } from "@/features/orders/queries";
import { getDayChangesForVendor } from "@/features/day-changes/queries";
import { countActivePlansByProduct } from "@/features/subscriptions/queries";
import { countOpenShopOrders } from "@/features/shop-orders/queries";
import { computeVendorBalance } from "@/features/payouts/queries";
import { BigCount } from "@/features/orders/components/big-count";
import { getProviderSchedule, isBookingProvider } from "@/features/bookings/queries";
import { SessionActions } from "@/features/bookings/components/booking-buttons";
import { MODE_LABEL, formatSlotTime } from "@/core/booking";

export const metadata = { title: "Today" };

const CHANGE_LABEL: Record<string, { text: (qty: number) => string; tone: string }> = {
  skip: { text: () => "Skipped", tone: "bg-bg text-muted" },
  extra: { text: (q) => `+${q} extra`, tone: "bg-mint text-good" },
  qty: { text: (q) => `Qty ${q}`, tone: "bg-butter text-warn" },
};

export default async function TodayPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const today = todayIST();
  const access = await requireVendorAccess(slug);

  const [products, todayData, changes, planCounts, newOrders, balance, provider, schedule] = await Promise.all([
    getVendorProducts(slug),
    getTodayOrders(slug, today),
    getDayChangesForVendor(slug, today),
    countActivePlansByProduct(slug, today),
    countOpenShopOrders(access.vendorId),
    access.role === "driver" ? null : computeVendorBalance(access.vendorId, access.vendor.commissionBps),
    isBookingProvider(access.vendorId),
    getProviderSchedule(slug, 1),
  ]);
  const sessionsToday = schedule.rows.filter((r) => todayIST(r.booking.startsAt) === today);
  const now = new Date();

  const countByProduct = new Map(todayData.counts.map((c) => [c.product.id, c]));
  // Only items that deliver today: active plans or orders already locked for today.
  const kitchen = products.filter((p) => countByProduct.has(p.id) || ((planCounts.get(p.id) ?? 0) > 0 && !p.archivedAt));
  const totalToPrepare = kitchen.reduce((s, p) => s + (countByProduct.get(p.id)?.confirmedQty ?? 0), 0);
  const delivered = todayData.orders.filter((o) => o.order.status === "delivered").length;
  const activePlans = Array.from(planCounts.values()).reduce((s, n) => s + n, 0);
  const menuItems = products.filter((p) => !p.archivedAt).length;
  const base = `/merchant-panel/${slug}`;

  const dateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  const kpis = [
    provider
      ? { label: "Sessions today", value: String(sessionsToday.length), sub: `${sessionsToday.filter((r) => r.booking.status === "done").length} done`, href: `${base}/bookings`, icon: Navigation }
      : { label: "To prepare today", value: String(totalToPrepare), sub: `${delivered} delivered`, href: `${base}/run`, icon: Navigation },
    { label: "New app orders", value: String(newOrders), sub: newOrders ? "Waiting for you" : "All caught up", href: `${base}/orders`, icon: BellRing, hot: newOrders > 0 },
    { label: "Active plans", value: String(activePlans), sub: `${menuItems} menu items`, href: `${base}/subscriptions`, icon: Repeat },
    ...(balance
      ? [{ label: "Available to withdraw", value: formatINR(balance.availablePaise), sub: balance.pendingPaise ? `${formatINR(balance.pendingPaise)} pending` : "Online payments", href: `${base}/earnings`, icon: Wallet }]
      : []),
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{dateLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Today at {access.vendor.name}</h1>
        </div>
        <Link href={provider ? `${base}/bookings` : `${base}/run`} className="flex h-11 items-center gap-2 rounded-[12px] bg-accent px-4 text-sm font-bold text-white shadow-xs transition active:scale-95">
          <Navigation className="h-4 w-4" aria-hidden="true" /> {provider ? "Open bookings" : "Start delivery run"}
        </Link>
      </div>

      {newOrders > 0 && (
        <Link href={`${base}/orders`} className="flex items-center gap-3 rounded-[16px] border border-accent/30 bg-peach p-4 transition hover:border-accent">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-ink">{newOrders} new {newOrders === 1 ? "order needs" : "orders need"} a reply</span>
            <span className="block text-sm text-muted">Accept or decline so households know what to expect.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-accent" aria-hidden="true" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className={"group rounded-[16px] border bg-surface p-4 transition hover:border-ink/30 hover:shadow-sm " + ("hot" in k && k.hot ? "border-accent/40" : "border-line")}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <Icon className="h-4 w-4 text-muted group-hover:text-ink" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink sm:text-3xl">{k.value}</p>
              <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
            </Link>
          );
        })}
      </div>

      {provider && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Today&apos;s sessions</h2>
            <Link href={`${base}/availability`} className="text-sm font-semibold text-accent">Availability →</Link>
          </div>
          {sessionsToday.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">No sessions today. Keep your weekly hours up to date so clients can book.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sessionsToday.map(({ booking, customerName, productName }) => (
                <li key={booking.id} className="rounded-[16px] border border-line bg-surface p-4">
                  <p className="font-mono text-lg font-bold tabular-nums text-ink">{formatSlotTime(booking.startsAt)}</p>
                  <p className="truncate font-semibold text-ink">{customerName}</p>
                  <p className="truncate text-xs text-muted">{productName ?? "Session"} · {MODE_LABEL[booking.mode] ?? booking.mode} · <span className="capitalize">{booking.status.replace("_", "-")}</span></p>
                  {booking.status === "confirmed" && access.role !== "driver" && (
                    <div className="mt-3"><SessionActions slug={slug} bookingId={booking.id} started={booking.startsAt <= now} /></div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(!provider || kitchen.length > 0) && (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Kitchen counts</h2>
          <Link href={`${base}/run`} className="text-sm font-semibold text-accent">Run sheet →</Link>
        </div>
        {kitchen.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-line bg-surface p-8 text-center">
            <p className="font-semibold text-ink">Nothing to deliver today</p>
            <p className="mt-1 text-sm text-muted">Counts appear here for items with active plans. Households subscribe from your store page.</p>
            <Link href={`${base}/products`} className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white">Manage menu</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {kitchen.map((p) => {
              const stats = countByProduct.get(p.id);
              return (
                <BigCount
                  key={p.id}
                  product={p}
                  confirmedQty={stats?.confirmedQty ?? 0}
                  deliveredCount={todayData.orders.filter((o) => o.product.id === p.id && o.order.status === "delivered").length}
                  skippedCount={stats?.skippedCount ?? 0}
                />
              );
            })}
          </div>
        )}
      </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Today&apos;s changes</h2>
            <span className="text-xs text-muted tabular-nums">{changes.length} {changes.length === 1 ? "change" : "changes"}</span>
          </div>
          {changes.length === 0 ? (
            <p className="rounded-[16px] border border-line bg-surface p-5 text-sm text-muted">No skips or extras for today. Every plan delivers as usual.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface">
              {changes.map(({ change, customer, product }) => {
                const label = CHANGE_LABEL[change.kind] ?? CHANGE_LABEL.qty!;
                return (
                  <li key={change.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {customer.name} <span className="text-xs font-normal text-muted">· {customer.flat}{customer.tower !== "-" ? `, ${customer.tower}` : ""}</span>
                      </p>
                      <p className="truncate text-xs text-muted">
                        {product.name} · via {change.source}
                        {change.isLate && <span className="ml-1 font-medium text-bad">· late</span>}
                      </p>
                    </div>
                    <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " + label.tone}>{label.text(change.qty)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Shortcuts</h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {[
              { label: "Menu", href: `${base}/products`, icon: UtensilsCrossed },
              { label: "Cans & dabbas", href: `${base}/inventory`, icon: Package },
              { label: "Analytics", href: `${base}/analytics`, icon: ChartColumn },
              { label: "Earnings", href: `${base}/earnings`, icon: Wallet },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.label} href={s.href} className="flex h-12 items-center gap-3 rounded-[12px] border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-ink/30">
                  <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="flex-1">{s.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
