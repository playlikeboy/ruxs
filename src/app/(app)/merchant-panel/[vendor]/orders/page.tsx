import Link from "next/link";
import { formatINR } from "@/core/money";
import type { ShopOrderStatus } from "@/core/shop";
import { SLOT_LABEL } from "@/config/service-kinds";
import { dayLabelIST } from "@/core/time";
import { getVendorShopOrders } from "@/features/shop-orders/queries";
import { OrderStatusButtons } from "@/features/shop-orders/components/order-status-buttons";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Orders" };

const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", day: "numeric", month: "short" });

export default async function MerchantOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ vendor: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { vendor: slug } = await params;
  const { view: rawView } = await searchParams;
  const view = rawView === "done" ? "done" : "open";
  const { orders } = await getVendorShopOrders(slug, view);
  const base = `/merchant-panel/${slug}/orders`;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Orders</h1>
        <p className="mt-0.5 text-sm text-muted">One-time orders from the RUXS app. Daily plans are on Today.</p>
      </div>

      <div className="grid grid-cols-2 rounded-[12px] bg-bg p-1 text-sm font-semibold">
        <Link href={base} className={"rounded-[10px] py-2 text-center " + (view === "open" ? "bg-surface text-ink shadow-xs" : "text-muted")}>Active</Link>
        <Link href={base + "?view=done"} className={"rounded-[10px] py-2 text-center " + (view === "done" ? "bg-surface text-ink shadow-xs" : "text-muted")}>Past 14 days</Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={view === "open" ? "No active orders" : "Nothing in the last 14 days"}
          description={view === "open" ? "New orders appear here the moment a household places them. Keep your menu items available to get more." : "Delivered, declined and cancelled orders show here."}
          icon="bill"
        />
      ) : (
        <ul className="grid items-start gap-3 lg:grid-cols-2">
          {orders.map(({ order, items, customerName, customerPhone }) => (
            <li key={order.id} className={"space-y-3 rounded-[14px] border bg-surface p-4 " + (order.status === "placed" ? "border-accent/40 shadow-[0_0_0_3px_rgba(189,75,42,0.08)]" : "border-line")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{customerName}</p>
                  <p className="text-xs text-muted">{order.number} · {timeFmt.format(order.createdAt)}</p>
                </div>
                <StatusPill status={order.status} />
              </div>
              <ul className="space-y-1 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span className="text-ink"><span className="font-mono font-bold tabular-nums">{i.qty}×</span> {i.name}</span>
                    <span className="tabular-nums text-muted">{formatINR(i.lineTotalPaise)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 rounded-[10px] bg-bg p-3 text-xs text-muted">
                <p><span className="font-semibold text-ink">{dayLabelIST(order.deliverOn)}</span> · {SLOT_LABEL[order.slot] ?? order.slot}</p>
                <p>{order.address}</p>
                <p>Phone: <a href={`tel:${customerPhone}`} className="font-mono text-ink">{customerPhone}</a></p>
                {order.notes && <p className="text-warn">Note: {order.notes}</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{order.paymentMode === "online" ? (order.paymentStatus === "paid" ? "Paid online · do not collect" : "Refund due · do not collect") : order.paymentMode === "cod" ? "Collect on delivery" : "Add to monthly bill"}</span>
                <span className="font-mono text-base font-bold tabular-nums text-ink">{formatINR(order.totalPaise)}</span>
              </div>
              <OrderStatusButtons orderId={order.id} status={order.status as ShopOrderStatus} slug={slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
