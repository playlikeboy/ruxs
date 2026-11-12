import { requireVendorModule } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import type { ShopOrderStatus } from "@/core/shop";
import { SLOT_LABEL } from "@/config/service-kinds";
import { dayLabelIST } from "@/core/time";
import { getVendorShopOrders } from "@/features/shop-orders/queries";
import { OrderStatusButtons } from "@/features/shop-orders/components/order-status-buttons";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { SegmentedLinks } from "@/components/ui/segmented";

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
  const [, { view: rawView }] = await Promise.all([requireVendorModule(slug, "orders"), searchParams]);
  const view = rawView === "done" ? "done" : "open";
  const { orders } = await getVendorShopOrders(slug, view);
  const base = `/merchant-panel/${slug}/orders`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader title="Orders" description="One-time orders from the RUXs app. Daily plans are on Today." />

      <SegmentedLinks
        className="w-full max-w-xs"
        active={view}
        items={[
          { key: "open", label: "Active", href: base },
          { key: "done", label: "Past 14 days", href: base + "?view=done" },
        ]}
      />

      {orders.length === 0 ? (
        <EmptyState
          title={view === "open" ? "No active orders" : "Nothing in the last 14 days"}
          description={view === "open" ? "New orders appear here the moment a household places them. Keep your menu items available to get more." : "Delivered, declined and cancelled orders show here."}
          icon="bill"
        />
      ) : (
        <ul className="grid items-start gap-4 lg:grid-cols-2">
          {orders.map(({ order, items, customerName, customerPhone, latitude, longitude }) => {
            const mapsUrl = latitude && longitude
              ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
            return (
              <li key={order.id} className={"space-y-3.5 rounded-card border bg-surface p-4 " + (order.status === "placed" ? "border-accent/50" : "border-line")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{customerName}</p>
                    <p className="text-xs text-muted">{order.number} · {timeFmt.format(order.createdAt)}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <ul className="space-y-1 text-sm">
                  {items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span className="min-w-0 text-ink"><span className="font-bold tabular-nums">{i.qty}×</span> {i.name}</span>
                      <span className="shrink-0 tabular-nums text-muted">{formatINR(i.lineTotalPaise)}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1.5 rounded-control bg-app-canvas p-3 text-xs text-muted">
                  <p><span className="font-semibold text-ink">{dayLabelIST(order.deliverOn)}</span> · {SLOT_LABEL[order.slot] ?? order.slot}</p>
                  <p className="text-ink">{order.address}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-1.5">
                    <p>Phone: <a href={`tel:${customerPhone}`} className="tabular-nums text-ink underline">{customerPhone}</a></p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 rounded-control border border-line bg-surface px-2.5 text-xs font-semibold text-accent transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      Directions<span className="sr-only"> in Google Maps (opens in a new tab)</span>
                    </a>
                  </div>
                  {order.notes && <p className="text-warn">Note: {order.notes}</p>}
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">{order.paymentMode === "online" ? (order.paymentStatus === "paid" ? "Paid online · do not collect" : "Refund due · do not collect") : order.paymentMode === "cod" ? "Collect on delivery" : "Add to monthly bill"}</span>
                  <span className="shrink-0 text-base font-bold tabular-nums text-ink">{formatINR(order.totalPaise)}</span>
                </div>
                <OrderStatusButtons
                  orderId={order.id}
                  status={order.status as ShopOrderStatus}
                  slug={slug}
                  vendorDeliveredAt={order.vendorDeliveredAt}
                  consumerDeliveredAt={order.consumerDeliveredAt}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
