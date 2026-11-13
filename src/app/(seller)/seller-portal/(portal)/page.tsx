import Link from "next/link";
import { ArrowRight, FileUp, Plus, Send, Settings, TicketPercent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { STORE_ORDER_STATUSES } from "@/core/store";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreOverview } from "@/features/store/queries";
import { getAdminStoreAnalytics, getStorePendingCounts } from "@/features/store/admin-queries";
import { RevenueChart, ShareBar } from "@/features/store/seller-components/revenue-chart";
import { PAGE, PageHeader, Panel, panelLink, rowLink } from "@/features/store/seller-components/seller-ui";
import { StockBadge, StorePaymentBadge, StoreStatusBadge, istDateTime, orderStatusText } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Dashboard" };

const BASE = "/seller-portal";

export default async function SellerDashboardPage() {
  await requireSeller();
  const [o, a, pending] = await Promise.all([getAdminStoreOverview(), getAdminStoreAnalytics(), getStorePendingCounts()]);

  const todo = [
    { n: pending.toPack, one: "new order to pack", many: "new orders to pack", href: `${BASE}/orders?status=placed` },
    { n: pending.toForward, one: "order not forwarded to a partner", many: "orders not forwarded to a partner", href: `${BASE}/orders?status=to_forward` },
    { n: pending.refundDue, one: "refund to send", many: "refunds to send", href: `${BASE}/orders?status=refund_due` },
    { n: pending.returns, one: "return in progress", many: "returns in progress", href: `${BASE}/returns?status=all` },
    { n: pending.reviews, one: "review to check", many: "reviews to check", href: `${BASE}/reviews` },
  ].filter((t) => t.n > 0);

  const statusTotal = STORE_ORDER_STATUSES.reduce((n, s) => n + a.ordersByStatus[s], 0);
  const pay = a.paymentSplit;
  const payTotal = pay.online.revenuePaise + pay.cod.revenuePaise;
  const topUnits = Math.max(1, ...a.topProducts.map((p) => p.units));
  const returnsTotal = a.returns.requested + a.returns.approved + a.returns.received + a.returns.refunded + a.returns.rejected;

  return (
    <div className={PAGE}>
      <PageHeader
        title="Dashboard"
        description="RUXs Store sales, stock and the work waiting for the team. Sales count booked orders: placed, packed, out for delivery or delivered."
        meta={
          <>
            <Badge tone={o.settings.isOpen ? "good" : "bad"}>{o.settings.isOpen ? "Store open" : "Store closed"}</Badge>
            <Badge tone={o.settings.codEnabled ? "good" : "neutral"}>{o.settings.codEnabled ? "COD on" : "COD off"}</Badge>
            <Badge tone="neutral" className="tabular-nums">
              {o.activeProducts} live {o.activeProducts === 1 ? "product" : "products"}
            </Badge>
          </>
        }
        actions={
          <ButtonLink href={`${BASE}/products/new`} size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" /> New product
          </ButtonLink>
        }
      />

      <Panel id="todo-h" title="Needs attention">
        {todo.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted">Nothing is waiting. New orders, returns and reviews show up here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {todo.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className={`flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 text-sm ${rowLink}`}>
                  <span className="text-ink">
                    <span className="font-semibold tabular-nums">{t.n}</span> {t.n === 1 ? t.one : t.many}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel id="sales-h" title="Sales, last 30 days" note="India time. Today is the last bar.">
        <dl className="grid grid-cols-2 divide-line border-b border-line sm:grid-cols-4 sm:divide-x">
          {[
            { k: "Sales", v: formatINR(a.totals.revenuePaise) },
            { k: "Orders", v: String(a.totals.orders) },
            { k: "Average order", v: formatINR(a.totals.averageOrderPaise) },
            { k: "Coupon discounts", v: formatINR(a.totals.discountPaise) },
          ].map((s) => (
            <div key={s.k} className="px-4 py-3">
              <dt className="text-xs font-medium text-muted">{s.k}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{s.v}</dd>
            </div>
          ))}
        </dl>
        <RevenueChart days={a.revenueByDay} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="status-h" title="Orders by status" note="All time." action={<Link href={`${BASE}/orders?status=all`} className={panelLink}>All orders</Link>} padded>
          {statusTotal === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {STORE_ORDER_STATUSES.map((s) => (
                <li key={s}>
                  <Link href={`${BASE}/orders?status=${s}`} className="block rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                    <ShareBar
                      label={orderStatusText(s)}
                      value={a.ordersByStatus[s]}
                      share={a.ordersByStatus[s] / statusTotal}
                      tone={s === "cancelled" || s === "returned" ? "muted" : s === "placed" || s === "awaiting_payment" ? "accent" : "deep"}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel id="pay-h" title="Online and cash on delivery" note="Booked orders, last 30 days." padded>
          {payTotal === 0 ? (
            <p className="text-sm text-muted">No sales in the last 30 days.</p>
          ) : (
            <div className="space-y-3">
              <ShareBar
                label={<>Online (Razorpay) · <span className="tabular-nums">{pay.online.orders}</span> orders</>}
                value={formatINR(pay.online.revenuePaise)}
                share={pay.online.revenuePaise / payTotal}
              />
              <ShareBar
                label={<>Cash on delivery · <span className="tabular-nums">{pay.cod.orders}</span> orders</>}
                value={formatINR(pay.cod.revenuePaise)}
                share={pay.cod.revenuePaise / payTotal}
                tone="accent"
              />
            </div>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Returns asked</dt>
              <dd className="font-semibold tabular-nums text-ink">{returnsTotal}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Refunded</dt>
              <dd className="font-semibold tabular-nums text-ink">{a.returns.refunded}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Declined</dt>
              <dd className="font-semibold tabular-nums text-ink">{a.returns.rejected}</dd>
            </div>
          </dl>
        </Panel>

        <Panel id="top-h" title="Top products" note="By units sold, last 30 days." action={<Link href={`${BASE}/products`} className={panelLink}>All products</Link>} padded>
          {a.topProducts.length === 0 ? (
            <p className="text-sm text-muted">No products sold in the last 30 days.</p>
          ) : (
            <ol className="space-y-3">
              {a.topProducts.map((p) => (
                <li key={p.productId}>
                  <Link href={`${BASE}/products/${p.productId}`} className="block rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                    <ShareBar
                      label={p.name}
                      value={
                        <>
                          {p.units} sold <span className="font-normal text-muted">· {formatINR(p.revenuePaise)}</span>
                        </>
                      }
                      share={p.units / topUnits}
                    />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          id="low-h"
          title="Low stock"
          action={
            <Link href={`${BASE}/inventory`} className={panelLink}>
              {o.outOfStockCount > 0 ? `${o.outOfStockCount} out of stock` : "Inventory"}
            </Link>
          }
        >
          {a.lowStock.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">Every live product is above its low-stock level.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {a.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`${BASE}/products/${p.id}`} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${rowLink}`}>
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
        </Panel>

        <Panel id="partners-h" title="Partner workload" note="Internal. Households only see Shipped by RUXs." action={<Link href={`${BASE}/partners`} className={panelLink}>Partners</Link>}>
          {a.partnerWorkload.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">No partners yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-semibold">Partner</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Open</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Sent, 30 days</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {a.partnerWorkload.map((p) => (
                    <tr key={p.partnerId ?? "none"}>
                      <th scope="row" className={"px-4 py-2 font-medium " + (p.partnerId ? "text-ink" : "text-muted")}>{p.name}</th>
                      <td className="px-2 py-2 text-right tabular-nums text-ink">{p.open}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-ink">{p.forwarded30d}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-ink">{p.delivered30d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel id="coupons-h" title="Coupons used" note="Last 30 days." action={<Link href={`${BASE}/coupons`} className={panelLink}>Coupons</Link>}>
          {a.couponUsage.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">No coupon was used in the last 30 days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {a.couponUsage.map((c) => (
                <li key={c.couponId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-mono font-semibold text-ink">{c.code}</span>
                    <span className="block text-xs tabular-nums text-muted">
                      {c.uses} {c.uses === 1 ? "use" : "uses"} · {formatINR(c.revenuePaise)} in sales
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink">−{formatINR(c.discountPaise)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel id="recent-h" title="Recent orders" action={<Link href={`${BASE}/orders?status=all`} className={panelLink}>View all</Link>}>
        {o.recentOrders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No store orders yet. They appear here once a household checks out.</p>
        ) : (
          <ul className="divide-y divide-line">
            {o.recentOrders.map((r) => (
              <li key={r.id}>
                <Link href={`${BASE}/orders/${r.id}`} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 ${rowLink}`}>
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
      </Panel>

      <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
        <ButtonLink href={`${BASE}/orders?status=to_forward`} variant="secondary" size="sm">
          <Send className="h-4 w-4" aria-hidden="true" /> Forward orders
        </ButtonLink>
        <ButtonLink href={`${BASE}/products/import`} variant="secondary" size="sm">
          <FileUp className="h-4 w-4" aria-hidden="true" /> Import products
        </ButtonLink>
        <ButtonLink href={`${BASE}/coupons`} variant="secondary" size="sm">
          <TicketPercent className="h-4 w-4" aria-hidden="true" /> Add a coupon
        </ButtonLink>
        <ButtonLink href={`${BASE}/settings`} variant="secondary" size="sm">
          <Settings className="h-4 w-4" aria-hidden="true" /> Store settings
        </ButtonLink>
      </nav>
    </div>
  );
}
