import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { formatINR } from "@/core/money";
import { isOpenStatus, type ShopOrderStatus } from "@/core/shop";
import { SLOT_LABEL } from "@/config/service-kinds";
import { dayLabelIST } from "@/core/time";
import { getMyOrder } from "@/features/consumer/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { CancelOrderButton } from "@/features/consumer/components/cancel-order-button";

export const metadata = { title: "Order" };

const STEPS: { status: ShopOrderStatus; label: string }[] = [
  { status: "placed", label: "Order placed" },
  { status: "accepted", label: "Store is preparing it" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMyOrder(id);
  if (!data) notFound();
  const { order, items, vendorName, vendorSlug } = data;
  const status = order.status as ShopOrderStatus;
  const stepIndex = STEPS.findIndex((s) => s.status === status);
  const closedBad = status === "cancelled" || status === "rejected";

  return (
    <div className="min-h-dvh bg-neutral-50 pb-8">
      <PageHeader title={vendorName} subtitle={order.number} back="/app/orders" />
      <div className="space-y-4 p-4">
        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Order status</h2>
            <StatusPill status={status} />
          </div>
          {closedBad ? (
            <p className="mt-3 text-sm text-neutral-600">{order.cancelReason ?? (status === "rejected" ? "The store couldn't take this order." : "This order was cancelled.")}</p>
          ) : (
            <ol className="mt-4 space-y-0">
              {STEPS.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <li key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={"flex h-6 w-6 items-center justify-center rounded-full " + (done ? "bg-good text-white" : "border-2 border-neutral-200 bg-white")}>
                        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      {i < STEPS.length - 1 && <span className={"h-7 w-0.5 " + (i < stepIndex ? "bg-good" : "bg-neutral-200")} />}
                    </div>
                    <p className={"pt-0.5 text-sm " + (done ? "font-semibold text-ink" : "text-neutral-400")}>{step.label}</p>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-4 text-xs text-neutral-500">
            {dayLabelIST(order.deliverOn)} · {SLOT_LABEL[order.slot] ?? order.slot}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="font-semibold text-ink">Items</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-neutral-700">{i.qty} × {i.name}</span>
                <span className="tabular-nums text-ink">{formatINR(i.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-dashed border-black/10 pt-3 text-sm">
            <div className="flex justify-between text-neutral-600"><dt>Item total</dt><dd className="tabular-nums">{formatINR(order.subtotalPaise)}</dd></div>
            <div className="flex justify-between text-neutral-600"><dt>Delivery</dt><dd className="tabular-nums">{order.deliveryFeePaise ? formatINR(order.deliveryFeePaise) : "Free"}</dd></div>
            <div className="flex justify-between text-[15px] font-semibold text-ink"><dt>Total</dt><dd className="tabular-nums">{formatINR(order.totalPaise)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-neutral-500">
            {order.paymentMode === "cod" ? "Pay on delivery by cash or UPI." : "Added to your monthly bill from " + vendorName + "."}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="font-semibold text-ink">Delivering to</h2>
          <p className="mt-1 text-sm text-neutral-600">{order.address}</p>
          {order.notes && <p className="mt-2 text-sm text-neutral-500">Note: {order.notes}</p>}
        </section>

        {status === "placed" && <CancelOrderButton orderId={order.id} />}
        {!isOpenStatus(status) && (
          <Link href={`/app/store/${vendorSlug}`} className="flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">Order again</Link>
        )}
        <p className="text-center text-xs text-neutral-500">Need help with this order? Write to support@ruxs.in with {order.number}.</p>
      </div>
    </div>
  );
}
