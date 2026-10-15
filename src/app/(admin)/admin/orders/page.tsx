import Link from "next/link";
import { formatINR } from "@/core/money";
import type { ShopOrderStatus } from "@/core/shop";
import { getAdminShopOrders } from "@/features/shop-orders/queries";
import { OrderStatusButtons } from "@/features/shop-orders/components/order-status-buttons";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { dayLabelIST } from "@/core/time";

export const metadata = { title: "Orders" };

const FILTERS = [
  { v: "", t: "All" },
  { v: "placed", t: "New" },
  { v: "accepted", t: "Preparing" },
  { v: "out_for_delivery", t: "On the way" },
  { v: "delivered", t: "Delivered" },
  { v: "cancelled", t: "Cancelled" },
  { v: "rejected", t: "Declined" },
];
const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = FILTERS.some((f) => f.v === raw) ? raw : "";
  const orders = await getAdminShopOrders(status || undefined);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All app orders</h1>
        <p className="mt-1 text-sm text-muted">Admins can move or resolve any open order on behalf of a store.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <Link key={f.t} href={f.v ? `/admin/orders?status=${f.v}` : "/admin/orders"} className={"shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium " + (status === f.v ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted")}>
            {f.t}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <p className="rounded-[12px] border border-line bg-surface p-8 text-center text-sm text-muted">No orders here.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {orders.map(({ order, items, vendorName, vendorSlug, customerName }) => (
            <li key={order.id} className="space-y-3 rounded-[14px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold"><Link href={`/merchant-panel/${vendorSlug}/orders`} className="hover:underline">{vendorName}</Link> → {customerName}</p>
                  <p className="text-xs text-muted"><span className="font-mono">{order.number}</span> · {timeFmt.format(order.createdAt)} · {order.paymentMode === "cod" ? "COD" : "Monthly bill"}</p>
                </div>
                <StatusPill status={order.status} />
              </div>
              <p className="text-sm text-muted">{items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{dayLabelIST(order.deliverOn)} · {order.address.slice(0, 60)}</span>
                <span className="font-mono font-bold tabular-nums">{formatINR(order.totalPaise)}</span>
              </div>
              <OrderStatusButtons orderId={order.id} status={order.status as ShopOrderStatus} admin />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
