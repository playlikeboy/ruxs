import Link from "next/link";
import { ChevronRight, ReceiptIndianRupee } from "lucide-react";
import { formatINR } from "@/core/money";
import { getMyOrders } from "@/features/consumer/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { StatusPill } from "@/features/consumer/components/status-pill";

export const metadata = { title: "Orders" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function OrdersPage() {
  const orders = await getMyOrders();

  return (
    <div>
      <PageHeader title="Your orders" />
      <div className="px-4 pt-3">
        <Link href="/app/bookings" className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <span><span className="font-semibold text-ink">Trainer &amp; physio bookings</span><span className="block text-xs text-neutral-500">Sessions are listed separately</span></span>
          <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky">
            <ReceiptIndianRupee className="h-9 w-9 text-[#1F5C99]" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">No orders yet</h2>
          <p className="mt-1.5 max-w-xs text-sm text-neutral-500">One-time orders show up here. Daily plans live in the Plans tab.</p>
          <Link href="/app" className="mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-semibold text-white">Start exploring</Link>
        </div>
      ) : (
        <ul className="space-y-3 p-4">
          {orders.map(({ order, vendorName, items }) => (
            <li key={order.id}>
              <Link href={`/app/orders/${order.id}`} className="block rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:bg-neutral-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{vendorName}</p>
                    <p className="text-xs text-neutral-500">{order.number} · {dateFmt.format(order.createdAt)}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <p className="mt-3 line-clamp-1 text-sm text-neutral-600">{items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</p>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-[15px] font-semibold text-ink tabular-nums">{formatINR(order.totalPaise)}</span>
                  <span className="flex items-center text-sm font-semibold text-accent">Details <ChevronRight className="h-4 w-4" /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
