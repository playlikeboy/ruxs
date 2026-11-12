import Link from "next/link";
import { ArrowRight, Package, Plus, Settings, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { STORE_STATUS_LABELS } from "@/core/store";
import { getAdminStoreOverview } from "@/features/store/queries";
import { StockBadge, StorePaymentBadge, StoreStatusBadge, istDateTime } from "@/features/store/admin-components/store-labels";

export const metadata = { title: "RUXs Store" };

const OPEN_STEPS = ["placed", "packed", "out_for_delivery", "awaiting_payment"] as const;

export default async function AdminStoreOverviewPage() {
  const o = await getAdminStoreOverview();
  const openTotal = o.openByStatus.placed + o.openByStatus.packed + o.openByStatus.out_for_delivery;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">RUXs Store</h1>
          <p className="mt-1 text-sm text-muted">
            Products RUXs sells directly to households. Separate from vendor orders and payouts.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={o.settings.isOpen ? "good" : "bad"}>{o.settings.isOpen ? "Store open" : "Store closed"}</Badge>
            <Badge tone={o.settings.codEnabled ? "good" : "neutral"}>{o.settings.codEnabled ? "COD on" : "COD off"}</Badge>
            <Badge tone="neutral" className="tabular-nums">{o.activeProducts} live products</Badge>
          </div>
        </div>
        <ButtonLink href="/admin/store/products/new" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" /> New product
        </ButtonLink>
      </div>

      {o.refundDue > 0 && (
        <Link
          href="/admin/store/orders?status=refund_due"
          className="flex items-center justify-between gap-3 rounded-card border border-bad/20 bg-bad/5 px-4 py-3 text-sm font-semibold text-bad transition hover:bg-bad/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="tabular-nums">
            {o.refundDue} {o.refundDue === 1 ? "order needs" : "orders need"} a refund
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      <section aria-labelledby="open-orders" className="rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="open-orders" className="text-base font-semibold text-ink">
            Open orders <span className="tabular-nums text-muted">({openTotal})</span>
          </h2>
          <Link href="/admin/store/orders" className="text-xs font-semibold text-accent hover:underline">
            All orders
          </Link>
        </div>
        <ul className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {OPEN_STEPS.map((s) => (
            <li key={s}>
              <Link
                href={`/admin/store/orders?status=${s}`}
                className="flex h-full flex-col gap-0.5 px-4 py-3 transition hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <span className="text-xs font-medium text-muted">{s === "placed" ? "New, to pack" : STORE_STATUS_LABELS[s]}</span>
                <span className="text-xl font-semibold tabular-nums text-ink">{o.openByStatus[s]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="month" className="rounded-card border border-line bg-surface p-4">
          <h2 id="month" className="text-base font-semibold text-ink">Revenue, {o.month.label}</h2>
          <p className="mt-0.5 text-xs text-muted">Online counts paid orders; COD counts delivered orders. India time.</p>
          <dl className="mt-3 divide-y divide-line text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted">Online (Razorpay)</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(o.month.onlinePaise)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">Cash on delivery</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(o.month.codPaise)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="font-semibold text-ink">Total · <span className="tabular-nums">{o.month.orders}</span> orders</dt>
              <dd className="font-bold tabular-nums text-ink">{formatINR(o.month.totalPaise)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="low-stock" className="rounded-card border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id="low-stock" className="text-base font-semibold text-ink">Low stock</h2>
            <Link href="/admin/store/products?filter=low" className="text-xs font-semibold text-accent hover:underline">
              {o.outOfStockCount > 0 ? `${o.outOfStockCount} out of stock` : "See all"}
            </Link>
          </div>
          {o.lowStock.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">Every live product is above its low-stock level.</p>
          ) : (
            <ul className="divide-y divide-line">
              {o.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/store/products/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-bg">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                      <span className="block text-xs text-muted">{p.sku}</span>
                    </span>
                    <StockBadge kind={p.stockKind} stock={p.stock} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="recent" className="rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="recent" className="text-base font-semibold text-ink">Recent orders</h2>
          <Link href="/admin/store/orders?status=all" className="text-xs font-semibold text-accent hover:underline">
            View all
          </Link>
        </div>
        {o.recentOrders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No store orders yet. They appear here once a household checks out.</p>
        ) : (
          <ul className="divide-y divide-line">
            {o.recentOrders.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/store/orders/${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 transition hover:bg-bg">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold tabular-nums text-ink">{r.orderNumber}</span>
                    <span className="block truncate text-xs text-muted">
                      {r.customerName} · {istDateTime(r.createdAt)}
                    </span>
                  </span>
                  <StoreStatusBadge status={r.status} />
                  <StorePaymentBadge status={r.paymentStatus} mode={r.paymentMode} />
                  <span className="w-20 text-right text-sm font-semibold tabular-nums text-ink">{formatINR(r.totalPaise)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav aria-label="Store sections" className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/store/products" variant="secondary" size="sm">
          <Package className="h-4 w-4" aria-hidden="true" /> Products
        </ButtonLink>
        <ButtonLink href="/admin/store/categories" variant="secondary" size="sm">
          <Tags className="h-4 w-4" aria-hidden="true" /> Categories
        </ButtonLink>
        <ButtonLink href="/admin/store/settings" variant="secondary" size="sm">
          <Settings className="h-4 w-4" aria-hidden="true" /> Delivery & payment settings
        </ButtonLink>
      </nav>
    </div>
  );
}
