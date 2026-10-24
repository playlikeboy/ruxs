import { UiIcon } from "@/components/ui/app-icon";
import { PriceBreakupList } from "@/features/consumer/components/price-breakup";
import { storedBreakup } from "@/core/pricing";
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
import { ConfirmDeliveryButton } from "@/features/consumer/components/confirm-delivery-button";
import { PayOrderButton } from "@/features/payments/components/pay-buttons";
import { RaiseDisputeButton } from "@/features/support/components/report-button";
import { getMyReviewState } from "@/features/reviews/queries";

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
  const myReview = await getMyReviewState(order.vendorId);

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
          <div className="mt-4 border-t border-dashed border-black/10 pt-3">
            <PriceBreakupList breakup={storedBreakup(order)} gstBps={0} gstIncluded={order.gstIncluded} totalLabel="Total" />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {order.paymentMode === "online"
              ? order.paymentStatus === "paid"
                ? "Paid online."
                : order.paymentStatus === "refund_due"
                  ? "Paid online. Your refund is being processed."
                  : order.paymentStatus === "refunded"
                    ? "Paid online and refunded."
                    : "Waiting for online payment."
              : order.paymentMode === "cod"
                ? "Pay on delivery by cash or UPI."
                : "Added to your monthly bill from " + vendorName + "."}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="font-semibold text-ink">Delivering to</h2>
          <p className="mt-1 text-sm text-neutral-600">{order.address}</p>
          {order.notes && <p className="mt-2 text-sm text-neutral-500">Note: {order.notes}</p>}
        </section>

        <ConfirmDeliveryButton
          orderId={order.id}
          status={status}
          vendorDeliveredAt={order.vendorDeliveredAt}
          consumerDeliveredAt={order.consumerDeliveredAt}
        />

        {status === "awaiting_payment" && <PayOrderButton orderId={order.id} totalPaise={order.totalPaise} />}
        {(status === "placed" || status === "awaiting_payment") && <CancelOrderButton orderId={order.id} />}
        {status === "delivered" && (
          myReview.mine ? (
            <Link
              href={`/app/store/${vendorSlug}#reviews`}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100/70"
            >
              <UiIcon name="star" /> You rated {vendorName} ({myReview.mine.rating}/5 stars)
            </Link>
          ) : (
            <Link
              href={`/app/store/${vendorSlug}#reviews`}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-neutral-50 active:scale-[0.98] transition-all"
            >
              <UiIcon name="star" /> Rate {vendorName}
            </Link>
          )
        )}
        {!isOpenStatus(status) && (
          <Link href={`/app/store/${vendorSlug}`} className="flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">Order again</Link>
        )}
        <div className="pt-1 flex justify-center">
          <RaiseDisputeButton
            orderId={order.id}
            vendorId={order.vendorId}
            vendorName={vendorName}
            label="Dispute or Report an Issue with This Order"
            variant="compact"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-rose-600 transition-colors"
          />
        </div>
        <p className="text-center text-xs text-neutral-500">Need direct escalation? Write to support@ruxs.in with {order.number}.</p>
      </div>
    </div>
  );
}
