import { notFound } from "next/navigation";
import { formatINR } from "@/core/money";
import { STORE_PAYMENT_STATUS_LABELS } from "@/core/store";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreOrder } from "@/features/store/queries";
import { PrintButton } from "@/features/store/seller-components/print-button";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";
import { istDate } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Invoice" };

/**
 * A printable bill for the household. Prices already include GST; the order
 * does not snapshot each item's GST rate, so no tax split is printed.
 */
export default async function SellerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSeller();
  const { id } = await params;
  const o = await getAdminStoreOrder(id);
  if (!o) notFound();
  const voided = o.status === "cancelled" || o.status === "awaiting_payment";

  return (
    <div className={PAGE}>
      <div className="print:hidden">
        <PageHeader
          back={{ href: `/seller-portal/orders/${o.id}`, label: `Order ${o.orderNumber}` }}
          title="Invoice"
          description="Print it or save it as a PDF from the print dialog. Prices include GST; this sheet does not split the tax per item."
          actions={<PrintButton label="Print invoice" />}
        />
        {voided && (
          <p role="status" className="mt-4 rounded-[12px] bg-butter px-4 py-3 text-sm text-warn">
            {o.status === "cancelled" ? "This order was cancelled. Don't hand this out as a bill." : "This order isn't paid yet. The bill is not final."}
          </p>
        )}
      </div>

      <article className="mx-auto max-w-2xl rounded-card border border-line bg-white p-6 text-black print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b border-black pb-3">
          <div>
            <p className="text-lg font-bold">RUXs Store</p>
            <p className="text-sm">Invoice</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold tabular-nums">{o.orderNumber}</p>
            <p>Order date: {istDate(o.placedAt ?? o.createdAt)}</p>
            {o.deliveredAt && <p>Delivered: {istDate(o.deliveredAt)}</p>}
          </div>
        </header>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 print:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase">Billed to</p>
            <p className="mt-1 font-semibold">{o.customerName}</p>
            <p className="tabular-nums">{o.phone}</p>
            {o.shipTo ? (
              <address className="mt-1 break-words not-italic">
                {o.shipTo.line1}
                {o.shipTo.line2 && <><br />{o.shipTo.line2}</>}
                <br />
                {o.shipTo.city}, {o.shipTo.state} <span className="tabular-nums">{o.shipTo.pincode}</span>
              </address>
            ) : (
              <p className="mt-1 whitespace-pre-line break-words">{o.address}</p>
            )}
          </div>
          <div className="sm:text-right print:text-right">
            <p className="text-xs font-semibold uppercase">Payment</p>
            <p className="mt-1">{o.paymentMode === "cod" ? "Cash on delivery" : "Paid online"}</p>
            <p className="font-semibold">{STORE_PAYMENT_STATUS_LABELS[o.paymentStatus]}</p>
          </div>
        </div>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black text-left">
              <th scope="col" className="py-1.5 pr-2">Item</th>
              <th scope="col" className="py-1.5 pr-2 text-right">Qty</th>
              <th scope="col" className="py-1.5 pr-2 text-right">Price</th>
              <th scope="col" className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it) => (
              <tr key={it.id} className="border-b border-black/30">
                <td className="py-1.5 pr-2">{it.name}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{it.qty}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatINR(it.unitPricePaise)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatINR(it.lineTotalPaise)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-2 pr-2 text-right">Subtotal</td>
              <td className="pt-2 text-right tabular-nums">{formatINR(o.subtotalPaise)}</td>
            </tr>
            {o.discountPaise > 0 && (
              <tr>
                <td colSpan={3} className="py-0.5 pr-2 text-right">Coupon{o.couponCode ? ` ${o.couponCode}` : ""}</td>
                <td className="py-0.5 text-right tabular-nums">−{formatINR(o.discountPaise)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="py-0.5 pr-2 text-right">Delivery</td>
              <td className="py-0.5 text-right tabular-nums">{o.deliveryFeePaise === 0 ? "Free" : formatINR(o.deliveryFeePaise)}</td>
            </tr>
            <tr className="border-t border-black text-base font-bold">
              <td colSpan={3} className="py-1.5 pr-2 text-right">Total</td>
              <td className="py-1.5 text-right tabular-nums">{formatINR(o.totalPaise)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-6 text-xs">All prices include GST. Sold and shipped by RUXs.</p>
      </article>
    </div>
  );
}
