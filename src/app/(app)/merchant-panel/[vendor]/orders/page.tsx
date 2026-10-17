import { requireVendorAccess } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/core/money";
import type { ShopOrderStatus } from "@/core/shop";
import { SLOT_LABEL } from "@/config/service-kinds";
import { dayLabelIST } from "@/core/time";
import { getVendorShopOrders } from "@/features/shop-orders/queries";
import { OrderStatusButtons } from "@/features/shop-orders/components/order-status-buttons";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { MapPin } from "lucide-react";

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
  // Booking providers have sessions, not deliveries.
  if ((await requireVendorAccess(slug)).vendor.businessType === "booking") redirect(`/merchant-panel/${slug}/bookings`);
  const { view: rawView } = await searchParams;
  const view = rawView === "done" ? "done" : "open";
  const { orders } = await getVendorShopOrders(slug, view);
  const base = `/merchant-panel/${slug}/orders`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Orders</h1>
        <p className="mt-0.5 text-sm text-muted">One-time orders from the RUXs app. Daily plans are on Today.</p>
      </div>

      <div className="inline-grid w-full max-w-xs grid-cols-2 rounded-xl border border-line bg-surface p-1 text-sm font-semibold shadow-2xs">
        <Link href={base} className={"rounded-lg py-1.5 text-center transition " + (view === "open" ? "bg-ink text-white shadow-2xs" : "text-muted hover:text-ink")}>Active</Link>
        <Link href={base + "?view=done"} className={"rounded-lg py-1.5 text-center transition " + (view === "done" ? "bg-ink text-white shadow-2xs" : "text-muted hover:text-ink")}>Past 14 days</Link>
      </div>

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
              <li key={order.id} className={"space-y-3.5 rounded-2xl border bg-surface p-4.5 shadow-2xs transition hover:shadow-xs " + (order.status === "placed" ? "border-accent/40 shadow-[0_0_0_3px_rgba(189,75,42,0.08)]" : "border-line")}>
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
                <div className="space-y-1.5 rounded-[10px] bg-bg p-3 text-xs text-muted">
                  <p><span className="font-semibold text-ink">{dayLabelIST(order.deliverOn)}</span> · {SLOT_LABEL[order.slot] ?? order.slot}</p>
                  <p className="text-ink">{order.address}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5">
                    <p>Phone: <a href={`tel:${customerPhone}`} className="font-mono text-ink underline">{customerPhone}</a></p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-line px-2 py-0.5 text-[11px] font-semibold text-accent hover:border-accent shadow-2xs transition active:scale-95"
                    >
                      <MapPin className="h-3 w-3" />
                      Google Maps ↗
                    </a>
                  </div>
                  {order.notes && <p className="text-warn">Note: {order.notes}</p>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{order.paymentMode === "online" ? (order.paymentStatus === "paid" ? "Paid online · do not collect" : "Refund due · do not collect") : order.paymentMode === "cod" ? "Collect on delivery" : "Add to monthly bill"}</span>
                  <span className="font-mono text-base font-bold tabular-nums text-ink">{formatINR(order.totalPaise)}</span>
                </div>
                <OrderStatusButtons orderId={order.id} status={order.status as ShopOrderStatus} slug={slug} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
