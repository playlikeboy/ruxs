import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, MapPin, PenLine, RotateCcw, Star, Truck, XCircle } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { getMyStoreOrder } from "@/features/store/queries";
import { KidsBackLink, kidsCard } from "@/features/kids/components/kids-ui";
import { StoreProductImage } from "@/features/store/components/store-product-card";
import { StoreStatusPill, paymentLine } from "@/features/store/components/store-status";
import { CancelStoreOrderButton, PayStoreOrderButton, RequestReturnForm } from "@/features/store/components/store-order-actions";
import type { StoreReturnStatus } from "@/features/store/types";
import { formatINR } from "@/core/money";

export const metadata: Metadata = { title: "Store order · RUXs Kids" };

const IST = "Asia/Kolkata";
const dateTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: IST });
const timeOnly = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: IST });

const dateOnly = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });

/** Return status as word plus colour, and what happens next. */
const RETURN_TONE: Record<StoreReturnStatus, string> = {
  requested: "bg-kids-sunny/60 text-warn",
  approved: "bg-kids-sky/60 text-kids-ink",
  received: "bg-kids-sky/60 text-kids-ink",
  refunded: "bg-kids-mint/70 text-good",
  rejected: "bg-bad/10 text-bad",
};
const RETURN_NEXT: Record<StoreReturnStatus, string> = {
  requested: "RUXs is reviewing your request. The answer shows here.",
  approved: "Your return is approved. Keep everything in its box; RUXs will contact you with the next steps.",
  received: "RUXs has the items back. Your refund is being processed.",
  refunded: "Your refund has been sent.",
  rejected: "RUXs could not accept this return.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StoreOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const order = await getMyStoreOrder(id);
  if (!order) notFound();

  const ended = order.status === "cancelled" || order.status === "returned";
  const awaiting = order.status === "awaiting_payment";
  const paid = order.paymentStatus === "paid";

  return (
    <div className="space-y-5">
      <KidsBackLink href="/app/kids/shop/orders" label="Store orders" />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StoreStatusPill status={order.status} label={order.statusLabel} />
          <span className="text-sm tabular-nums text-kids-ink/65">{order.orderNumber}</span>
        </div>
        <h1 className="font-kids text-[26px] font-semibold leading-tight tracking-tight">
          {awaiting
            ? "Waiting for payment"
            : order.status === "placed"
              ? "Order placed"
              : order.status === "packed"
                ? "Packed and ready"
                : order.status === "out_for_delivery"
                  ? "On the way"
                  : order.status === "delivered"
                    ? "Delivered"
                    : order.status === "cancelled"
                      ? "Order cancelled"
                      : "Order returned"}
        </h1>
        <p className="text-sm text-kids-ink/65">
          Ordered <time dateTime={order.createdAt.toISOString()}>{dateTime.format(order.createdAt)}</time>
        </p>
      </header>

      {awaiting && (
        <section className={`${kidsCard} space-y-3 p-4`} aria-labelledby="order-pay">
          <h2 id="order-pay" className="flex items-center gap-2 font-semibold">
            <Clock className="h-4 w-4 text-warn" aria-hidden="true" /> Payment pending
          </h2>
          {order.canPay && order.payBy ? (
            <>
              <p className="text-sm text-kids-ink/70">
                Your items are held until <time dateTime={order.payBy.toISOString()}>{timeOnly.format(order.payBy)}</time>. Pay before then to place the order.
              </p>
              <PayStoreOrderButton orderId={order.id} />
            </>
          ) : (
            <p className="text-sm text-kids-ink/70">The hold has ended. This order will be cancelled shortly and the items put back on sale.</p>
          )}
        </section>
      )}

      {ended ? (
        <section className={`${kidsCard} p-4`} aria-labelledby="order-ended">
          <h2 id="order-ended" className="flex items-center gap-2 font-semibold text-bad">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {order.status === "cancelled" ? "Cancelled" : "Returned"}
            {order.status === "cancelled" && order.cancelledAt && (
              <span className="font-normal text-kids-ink/65">
                {" "}
                · <time dateTime={order.cancelledAt.toISOString()}>{dateTime.format(order.cancelledAt)}</time>
              </span>
            )}
            {order.status === "returned" && order.returnedAt && (
              <span className="font-normal text-kids-ink/65">
                {" "}
                · <time dateTime={order.returnedAt.toISOString()}>{dateTime.format(order.returnedAt)}</time>
              </span>
            )}
          </h2>
          {order.cancelReason && <p className="mt-1 text-sm text-kids-ink/70">{order.cancelReason}</p>}
          {order.paymentStatus === "refund_due" && <p className="mt-2 text-sm font-medium">Your refund is being processed.</p>}
          {order.paymentStatus === "refunded" && <p className="mt-2 text-sm font-medium text-good">Refunded.</p>}
        </section>
      ) : (
        !awaiting && (
          <section className={`${kidsCard} p-4`} aria-labelledby="order-progress">
            <h2 id="order-progress" className="font-semibold">
              Progress
            </h2>
            <ol className="mt-3">
              {order.timeline.map((step, i) => {
                const last = i === order.timeline.length - 1;
                const current = step.done && (last || !order.timeline[i + 1]?.done);
                return (
                  <li key={step.status} className="relative flex gap-3 pb-4 last:pb-0" aria-current={current ? "step" : undefined}>
                    {!last && (
                      <span
                        aria-hidden="true"
                        className={cn("absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5", order.timeline[i + 1]?.done ? "bg-good" : "bg-kids-ink/15")}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                        step.done ? "border-good bg-good text-white" : "border-kids-ink/20 bg-white"
                      )}
                      aria-hidden="true"
                    >
                      {step.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className={cn("text-sm", step.done ? "font-semibold" : "text-kids-ink/60")}>
                        {step.label}
                        <span className="sr-only">{step.done ? ", done" : ", not yet"}</span>
                      </p>
                      {step.at && (
                        <p className="text-xs text-kids-ink/60">
                          <time dateTime={step.at.toISOString()}>{dateTime.format(step.at)}</time>
                        </p>
                      )}
                      {step.status === "out_for_delivery" && step.done && (
                        <p className="mt-0.5 flex items-start gap-1.5 text-xs text-kids-ink/70">
                          <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 break-words">
                            Shipped by {order.shippedBy}
                            {order.trackingNumber && (
                              <>
                                {" · Tracking "}
                                <span className="select-all font-semibold tabular-nums text-kids-ink">{order.trackingNumber}</span>
                              </>
                            )}
                          </span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {(order.status === "placed" || order.status === "packed" || order.status === "out_for_delivery") && (order.etaLabel || order.dispatchDays > 0) && (
              <p className="mt-3 text-sm text-kids-ink/70">
                {order.status === "placed" && order.dispatchDays > 0 && (
                  <>
                    RUXs packs and sends orders within {order.dispatchDays} {order.dispatchDays === 1 ? "day" : "days"}.{" "}
                  </>
                )}
                {order.etaLabel &&
                  (order.etaMaxDays != null && order.etaMaxDays <= 0
                    ? "It arrives the day it is sent."
                    : order.status === "out_for_delivery"
                      ? `It usually arrives ${order.etaLabel} after it is sent.`
                      : `Once sent, it arrives in ${order.etaLabel}.`)}
              </p>
            )}
          </section>
        )
      )}

      {(order.returnRequest || order.canRequestReturn) && (
        <section className={`${kidsCard} p-4`} aria-labelledby="order-return">
          <h2 id="order-return" className="flex flex-wrap items-center gap-2 font-semibold">
            <RotateCcw className="h-4 w-4 text-kids-ink/60" aria-hidden="true" /> Return
            {order.returnRequest && (
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", RETURN_TONE[order.returnRequest.status])}>
                {order.returnRequest.statusLabel}
              </span>
            )}
          </h2>
          {order.returnRequest && (
            <div className="mt-2 space-y-1.5 text-sm">
              <p className="text-kids-ink/75">{RETURN_NEXT[order.returnRequest.status]}</p>
              {order.returnRequest.note && (
                <p className="rounded-[12px] bg-kids-cream px-3 py-2">
                  <span className="font-semibold">From RUXs: </span>
                  {order.returnRequest.note}
                </p>
              )}
              <p className="break-words text-kids-ink/75">
                <span className="font-semibold text-kids-ink">Your reason: </span>
                {order.returnRequest.reason}
              </p>
              <p className="text-xs text-kids-ink/65">
                Requested <time dateTime={order.returnRequest.createdAt.toISOString()}>{dateTime.format(order.returnRequest.createdAt)}</time>
                {order.returnRequest.updatedAt.getTime() !== order.returnRequest.createdAt.getTime() && (
                  <>
                    {" · updated "}
                    <time dateTime={order.returnRequest.updatedAt.toISOString()}>{dateTime.format(order.returnRequest.updatedAt)}</time>
                  </>
                )}
              </p>
            </div>
          )}
          {order.canRequestReturn && (
            <div className={order.returnRequest ? "mt-3 border-t border-kids-ink/10 pt-3" : "mt-2"}>
              <p className="mb-3 text-sm text-kids-ink/75">
                {order.returnRequest ? "You can send a new request" : "Something not right? You can ask to return this order"}
                {order.returnUntil ? (
                  <>
                    {" until "}
                    <time dateTime={order.returnUntil.toISOString()}>{dateOnly.format(order.returnUntil)}</time>.
                  </>
                ) : (
                  "."
                )}
              </p>
              <RequestReturnForm orderId={order.id} />
            </div>
          )}
        </section>
      )}

      <section className={`${kidsCard} p-4`} aria-labelledby="order-items">
        <h2 id="order-items" className="font-semibold">
          Items
        </h2>
        <ul className="mt-2 divide-y divide-kids-ink/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <StoreProductImage src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1">
                {item.productSlug ? (
                  <Link href={`/app/kids/shop/p/${item.productSlug}`} className="line-clamp-2 text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-kids-ink">
                    {item.name}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
                )}
                <p className="text-xs tabular-nums text-kids-ink/65">
                  {item.qty} × {formatINR(item.unitPricePaise)}
                </p>
                {item.myRating != null ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-kids-ink/70">
                    <Star className="h-3.5 w-3.5 fill-kids-sunny text-warn" aria-hidden="true" />
                    You rated this {item.myRating} out of 5
                  </p>
                ) : (
                  item.canReview &&
                  item.productSlug && (
                    <Link
                      href={`/app/kids/shop/p/${item.productSlug}#reviews`}
                      className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <PenLine className="h-4 w-4" aria-hidden="true" /> Write a review
                    </Link>
                  )
                )}
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">{formatINR(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1.5 border-t border-kids-ink/10 pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-kids-ink/70">Items</dt>
            <dd className="tabular-nums">{formatINR(order.subtotalPaise)}</dd>
          </div>
          {order.discountPaise > 0 && (
            <div className="flex justify-between gap-3 font-medium text-good">
              <dt>Coupon{order.couponCode ? ` ${order.couponCode}` : ""}</dt>
              <dd className="tabular-nums">−{formatINR(order.discountPaise)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-kids-ink/70">Delivery</dt>
            <dd className="tabular-nums">{order.deliveryFeePaise === 0 ? "Free" : formatINR(order.deliveryFeePaise)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatINR(order.totalPaise)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-kids-ink/70">Payment</dt>
            <dd>{paymentLine(order.paymentMode, order.paymentStatus)}</dd>
          </div>
        </dl>
      </section>

      <section className={`${kidsCard} p-4`} aria-labelledby="order-address">
        <h2 id="order-address" className="flex items-center gap-2 font-semibold">
          <MapPin className="h-4 w-4 text-kids-ink/60" aria-hidden="true" /> {order.status === "delivered" ? "Delivered to" : "Delivering to"} {order.customerName}
        </h2>
        <p className="mt-1 break-words text-sm text-kids-ink/75">{order.address}</p>
        <p className="text-sm tabular-nums text-kids-ink/75">{order.phone}</p>
        {order.notes && <p className="mt-2 text-sm text-kids-ink/70">Note: {order.notes}</p>}
      </section>

      {order.canCancel && (
        <div className="space-y-1.5">
          <CancelStoreOrderButton orderId={order.id} paid={paid} />
          <p className="text-center text-xs text-kids-ink/60">You can cancel until the order is packed.</p>
        </div>
      )}
    </div>
  );
}
