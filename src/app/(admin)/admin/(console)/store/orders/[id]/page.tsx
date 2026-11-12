import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, ImageOff } from "lucide-react";
import { formatINR } from "@/core/money";
import { getAdminStoreOrder } from "@/features/store/queries";
import { PrintSlipButton, StoreOrderActions, StoreOrderDetailsForm } from "@/features/store/admin-components/order-controls";
import { StorePaymentBadge, StoreStatusBadge, istDate, istDateTime } from "@/features/store/admin-components/store-labels";

export const metadata = { title: "Store order" };

/** Printing shows only the packing slip, without the console chrome. */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #packing-slip, #packing-slip * { visibility: visible !important; }
  #packing-slip { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0; }
}`;

const PAYMENT_STATUS_TEXT: Record<string, string> = {
  created: "Started",
  paid: "Paid",
  failed: "Failed",
};

export default async function AdminStoreOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getAdminStoreOrder(id);
  if (!o) notFound();

  const mapHref =
    o.latitude != null && o.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}` : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/store/orders" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Orders
          </Link>
          <h1 className="text-2xl font-bold tracking-tight tabular-nums text-ink sm:text-3xl">{o.orderNumber}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StoreStatusBadge status={o.status} />
            <StorePaymentBadge status={o.paymentStatus} mode={o.paymentMode} />
            <span className="text-xs text-muted">Placed {istDateTime(o.createdAt)}</span>
          </div>
        </div>
        <PrintSlipButton />
      </div>

      <section aria-labelledby="next-h" className="rounded-card border border-line bg-surface p-4">
        <h2 id="next-h" className="mb-3 text-base font-semibold text-ink">Next step</h2>
        {o.status === "awaiting_payment" && o.payBy && (
          <p className="mb-3 text-sm text-warn">
            Waiting for online payment. Stock is held until {istDateTime(o.payBy)}, then the order cancels itself.
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
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="items-h" className="rounded-card border border-line bg-surface">
            <h2 id="items-h" className="border-b border-line px-4 py-3 text-base font-semibold text-ink">
              Items <span className="tabular-nums text-muted">({o.itemCount})</span>
            </h2>
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
                    <Link href={`/admin/store/products/${it.productId}`} className="block truncate text-sm font-medium text-ink hover:text-accent hover:underline">
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
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="tabular-nums text-ink">{o.deliveryFeePaise === 0 ? "Free" : formatINR(o.deliveryFeePaise)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-bold tabular-nums text-ink">{formatINR(o.totalPaise)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="ship-h" className="rounded-card border border-line bg-surface p-4">
            <h2 id="ship-h" className="mb-3 text-base font-semibold text-ink">Delivery details</h2>
            <StoreOrderDetailsForm orderId={o.id} courier={o.courier} trackingNumber={o.trackingNumber} adminNote={o.adminNote} />
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="cust-h" className="rounded-card border border-line bg-surface p-4">
            <h2 id="cust-h" className="mb-2 text-base font-semibold text-ink">Deliver to</h2>
            <p className="text-sm font-semibold text-ink">{o.customerName}</p>
            <p className="text-sm">
              <a href={`tel:${o.phone}`} className="tabular-nums text-accent hover:underline">
                {o.phone}
              </a>
            </p>
            {o.email && <p className="break-all text-sm text-muted">{o.email}</p>}
            <p className="mt-2 whitespace-pre-line break-words text-sm text-ink">{o.address}</p>
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
          </section>

          <section aria-labelledby="time-h" className="rounded-card border border-line bg-surface p-4">
            <h2 id="time-h" className="mb-3 text-base font-semibold text-ink">Timeline</h2>
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
          </section>

          <section aria-labelledby="pay-h" className="rounded-card border border-line bg-surface p-4">
            <h2 id="pay-h" className="mb-2 text-base font-semibold text-ink">Payments</h2>
            {o.paymentMode === "cod" ? (
              <p className="text-sm text-muted">Cash on delivery. Marked paid when delivered.</p>
            ) : o.payments.length === 0 ? (
              <p className="text-sm text-muted">No payment attempts yet.</p>
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
                    {p.refundId && <p className="break-all text-xs text-muted">Refund {p.refundId} · {istDateTime(p.refundedAt)}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Packing slip: hidden on screen, the only thing printed. */}
      <section id="packing-slip" aria-hidden="true" className="hidden bg-white text-black print:block">
        <div className="flex items-start justify-between border-b border-black pb-3">
          <div>
            <p className="text-lg font-bold">RUXs Store · Packing slip</p>
            <p className="text-sm">Order {o.orderNumber} · {istDate(o.createdAt)}</p>
          </div>
          <p className="text-right text-sm font-semibold">
            {o.paymentMode === "cod" ? `COD: collect ${formatINR(o.totalPaise)}` : o.paymentStatus === "paid" ? "Paid online" : "Online: not paid"}
          </p>
        </div>
        <div className="mt-3 text-sm">
          <p className="font-semibold">{o.customerName} · {o.phone}</p>
          <p className="whitespace-pre-line">{o.address}</p>
          {o.notes && <p className="mt-1">Note: {o.notes}</p>}
        </div>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1 pr-2">Item</th>
              <th className="py-1 pr-2 text-right">Qty</th>
              <th className="py-1 pr-2 text-right">Price</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it) => (
              <tr key={it.id} className="border-b border-black/30">
                <td className="py-1 pr-2">{it.name}</td>
                <td className="py-1 pr-2 text-right tabular-nums">{it.qty}</td>
                <td className="py-1 pr-2 text-right tabular-nums">{formatINR(it.unitPricePaise)}</td>
                <td className="py-1 text-right tabular-nums">{formatINR(it.lineTotalPaise)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-1 pr-2 text-right">Delivery</td>
              <td className="py-1 text-right tabular-nums">{o.deliveryFeePaise === 0 ? "Free" : formatINR(o.deliveryFeePaise)}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={3} className="py-1 pr-2 text-right">Total</td>
              <td className="py-1 text-right tabular-nums">{formatINR(o.totalPaise)}</td>
            </tr>
          </tfoot>
        </table>
        {(o.courier || o.trackingNumber) && (
          <p className="mt-3 text-sm">
            {o.courier}
            {o.courier && o.trackingNumber ? " · " : ""}
            {o.trackingNumber}
          </p>
        )}
      </section>
    </div>
  );
}
