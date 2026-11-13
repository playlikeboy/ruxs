import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, ImageOff, Printer } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreOrder } from "@/features/store/queries";
import { AuditList } from "@/features/store/seller-components/audit-list";
import { StoreOrderActions, StoreOrderDetailsForm } from "@/features/store/seller-components/order-controls";
import { OrderForwardPanel, PartnerUpdateForm } from "@/features/store/seller-components/order-forward";
import { ReturnActions } from "@/features/store/seller-components/return-actions";
import { PAGE, PageHeader, Panel, panelLink } from "@/features/store/seller-components/seller-ui";
import { ReturnBadge, StorePaymentBadge, StoreStatusBadge, istDateTime } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Order" };

const PAYMENT_STATUS_TEXT: Record<string, string> = { created: "Started", paid: "Paid", failed: "Failed" };

export default async function SellerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSeller();
  const { id } = await params;
  const o = await getAdminStoreOrder(id);
  if (!o) notFound();

  const base = `/seller-portal/orders/${o.id}`;
  const mapHref = o.latitude != null && o.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}` : null;
  const r = o.adminReturn;

  return (
    <div className={PAGE}>
      <PageHeader
        back={{ href: "/seller-portal/orders", label: "Orders" }}
        title={<span className="tabular-nums">{o.orderNumber}</span>}
        meta={
          <>
            <StoreStatusBadge status={o.status} />
            <StorePaymentBadge status={o.paymentStatus} mode={o.paymentMode} />
            <span className="text-xs text-muted">Placed {istDateTime(o.createdAt)}</span>
          </>
        }
        actions={
          <>
            <ButtonLink href={`${base}/packing-slip`} variant="secondary" size="sm">
              <Printer className="h-4 w-4" aria-hidden="true" /> Packing slip
            </ButtonLink>
            <ButtonLink href={`${base}/invoice`} variant="secondary" size="sm">
              <FileText className="h-4 w-4" aria-hidden="true" /> Invoice
            </ButtonLink>
          </>
        }
      />

      <Panel id="next-h" title="Next step" padded>
        {o.status === "awaiting_payment" && o.payBy && (
          <p className="mb-3 text-sm text-warn">Waiting for online payment. Stock is held until {istDateTime(o.payBy)}, then the order cancels itself.</p>
        )}
        {o.codToCollectPaise > 0 && o.status !== "cancelled" && (
          <p className="mb-3 text-sm text-ink">
            Cash to collect at the door: <span className="font-semibold tabular-nums">{formatINR(o.codToCollectPaise)}</span>
          </p>
        )}
        <StoreOrderActions
          orderId={o.id}
          orderNumber={o.orderNumber}
          nextStatuses={o.nextStatuses}
          paymentMode={o.paymentMode}
          paymentStatus={o.paymentStatus}
          totalPaise={o.totalPaise}
          canRefund={o.canRefund}
          courier={o.courier}
          trackingNumber={o.trackingNumber}
        />
        {o.cancelReason && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-semibold text-ink">Cancel reason:</span> {o.cancelReason}
          </p>
        )}
      </Panel>

      {r && (
        <Panel id="return-h" title="Return request" action={<Link href="/seller-portal/returns?status=all" className={panelLink}>All returns</Link>} padded>
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              <ReturnBadge status={r.status} />
              <span className="text-xs text-muted">Asked {istDateTime(r.createdAt)}</span>
            </p>
            <p className="break-words text-sm text-ink">
              <span className="font-semibold">Household&apos;s reason:</span> {r.reason}
            </p>
            {r.adminNote && (
              <p className="break-words text-sm text-muted">
                <span className="font-semibold text-ink">Our note:</span> {r.adminNote}
              </p>
            )}
            <ReturnActions ret={r} />
          </div>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel id="items-h" title={<>Items <span className="tabular-nums text-muted">({o.itemCount})</span></>}>
            <ul className="divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin uploads from any host
                    <img src={it.image} alt="" className="h-12 w-12 shrink-0 rounded-[10px] border border-line object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-app-canvas text-muted" aria-hidden="true">
                      <ImageOff className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <Link href={`/seller-portal/products/${it.productId}`} className="block truncate text-sm font-medium text-ink hover:text-accent hover:underline">
                      {it.name}
                    </Link>
                    <span className="block text-xs tabular-nums text-muted">
                      {formatINR(it.unitPricePaise)} × {it.qty}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatINR(it.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-line px-4 py-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums text-ink">{formatINR(o.subtotalPaise)}</dd>
              </div>
              {o.discountPaise > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">
                    Coupon{o.couponCode ? <> <span className="font-mono font-semibold text-ink">{o.couponCode}</span></> : null}
                  </dt>
                  <dd className="tabular-nums text-good">−{formatINR(o.discountPaise)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery{o.zoneName ? ` · ${o.zoneName}` : ""}</dt>
                <dd className="tabular-nums text-ink">{o.deliveryFeePaise === 0 ? "Free" : formatINR(o.deliveryFeePaise)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-bold tabular-nums text-ink">{formatINR(o.totalPaise)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel id="fwd-h" title="Fulfilment partner" note="Internal. The household only sees Shipped by RUXs." padded>
            <OrderForwardPanel key={`${o.fulfilment.partnerId}:${o.fulfilment.forwardEmailedAt?.toISOString()}`} orderId={o.id} fulfilment={o.fulfilment} />
            {o.fulfilment.partnerId && (
              <div className="mt-5 border-t border-line pt-4">
                <PartnerUpdateForm
                  key={o.updatedAt.toISOString()}
                  orderId={o.id}
                  partnerRef={o.fulfilment.partnerRef}
                  partnerStatusNote={o.fulfilment.partnerStatusNote}
                  courier={o.courier}
                  trackingNumber={o.trackingNumber}
                />
              </div>
            )}
          </Panel>

          <Panel id="ship-h" title="Courier and notes" note="The household sees the tracking number, never the courier name." padded>
            <StoreOrderDetailsForm key={o.updatedAt.toISOString()} orderId={o.id} courier={o.courier} trackingNumber={o.trackingNumber} adminNote={o.adminNote} />
          </Panel>

          <Panel id="audit-h" title="Activity" note="Newest first. Who did what on this order.">
            <AuditList rows={o.audit} empty="Nothing recorded for this order yet." compact />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel id="cust-h" title="Deliver to" padded>
            <p className="text-sm font-semibold text-ink">{o.customerName}</p>
            <p className="text-sm">
              <a href={`tel:${o.phone}`} className="tabular-nums text-accent hover:underline">
                {o.phone}
              </a>
            </p>
            {o.email && <p className="break-all text-sm text-muted">{o.email}</p>}
            {o.shipTo ? (
              <address className="mt-2 break-words text-sm not-italic text-ink">
                {o.shipTo.line1}
                {o.shipTo.line2 && <><br />{o.shipTo.line2}</>}
                {o.shipTo.landmark && <><br />Near {o.shipTo.landmark}</>}
                <br />
                {o.shipTo.city}, {o.shipTo.state} <span className="tabular-nums">{o.shipTo.pincode}</span>
              </address>
            ) : (
              <p className="mt-2 whitespace-pre-line break-words text-sm text-ink">{o.address}</p>
            )}
            {o.etaLabel && <p className="mt-2 text-xs text-muted">Promised delivery: {o.etaLabel} after dispatch</p>}
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-accent hover:underline">
                Open pin in Maps <ExternalLink className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            {o.notes && (
              <p className="mt-3 rounded-[10px] bg-app-canvas px-3 py-2 text-sm text-ink">
                <span className="font-semibold">Household note:</span> {o.notes}
              </p>
            )}
          </Panel>

          <Panel id="time-h" title="Timeline" padded>
            <ol className="space-y-2 text-sm">
              {o.timeline.map((s) => (
                <li key={s.status} className="flex items-center justify-between gap-3">
                  <span className={s.done ? "font-medium text-ink" : "text-muted"}>
                    {s.done ? "Done: " : "To do: "}
                    {s.label}
                  </span>
                  <span className="text-xs tabular-nums text-muted">{s.at ? istDateTime(s.at) : "—"}</span>
                </li>
              ))}
              {o.fulfilment.forwardedAt && (
                <li className="flex items-center justify-between gap-3">
                  <span className="font-medium text-ink">Forwarded to partner</span>
                  <span className="text-xs tabular-nums text-muted">{istDateTime(o.fulfilment.forwardedAt)}</span>
                </li>
              )}
              {o.cancelledAt && (
                <li className="flex items-center justify-between gap-3 text-bad">
                  <span className="font-medium">Cancelled</span>
                  <span className="text-xs tabular-nums">{istDateTime(o.cancelledAt)}</span>
                </li>
              )}
              {o.returnedAt && (
                <li className="flex items-center justify-between gap-3 text-bad">
                  <span className="font-medium">Returned</span>
                  <span className="text-xs tabular-nums">{istDateTime(o.returnedAt)}</span>
                </li>
              )}
            </ol>
          </Panel>

          <Panel id="pay-h" title="Payments" padded>
            {o.paymentMode === "cod" ? (
              <p className="text-sm text-muted">Cash on delivery. Marked paid when delivered.</p>
            ) : o.payments.length === 0 ? (
              <p className="text-sm text-muted">{o.totalPaise === 0 ? "Nothing to pay: a coupon covered the order." : "No payment attempts yet."}</p>
            ) : (
              <ul className="space-y-2">
                {o.payments.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className={p.status === "paid" ? "font-semibold text-good" : p.status === "failed" ? "font-semibold text-bad" : "font-semibold text-warn"}>
                        {PAYMENT_STATUS_TEXT[p.status] ?? p.status}
                        {p.refundId ? " · Refunded" : ""}
                      </span>
                      <span className="tabular-nums text-ink">{formatINR(p.amountPaise)}</span>
                    </div>
                    <p className="break-all text-xs text-muted">{p.razorpayPaymentId ?? p.razorpayOrderId}</p>
                    {p.failureReason && <p className="text-xs text-bad">{p.failureReason}</p>}
                    {p.refundId && (
                      <p className="break-all text-xs text-muted">
                        Refund {p.refundId} · {istDateTime(p.refundedAt)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
