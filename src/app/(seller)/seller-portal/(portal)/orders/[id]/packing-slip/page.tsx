import { notFound } from "next/navigation";
import { formatINR } from "@/core/money";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreOrder } from "@/features/store/queries";
import { PrintButton } from "@/features/store/seller-components/print-button";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";
import { istDate } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Packing slip" };

/** Goes in the box. The portal chrome hides itself in print, so the sheet is all that prints. */
export default async function SellerPackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSeller();
  const { id } = await params;
  const o = await getAdminStoreOrder(id);
  if (!o) notFound();

  return (
    <div className={PAGE}>
      <div className="print:hidden">
        <PageHeader
          back={{ href: `/seller-portal/orders/${o.id}`, label: `Order ${o.orderNumber}` }}
          title="Packing slip"
          description="Print it and put it in the box. It lists what to pack and the cash to collect, with no prices, partner or courier name."
          actions={<PrintButton label="Print slip" />}
        />
      </div>

      <article className="mx-auto max-w-2xl rounded-card border border-line bg-white p-6 text-black print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b border-black pb-3">
          <div>
            <p className="text-lg font-bold">RUXs Store</p>
            <p className="text-sm">Packing slip</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold tabular-nums">Order {o.orderNumber}</p>
            <p>{istDate(o.createdAt)}</p>
          </div>
        </header>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 print:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase">Ship to</p>
            <p className="mt-1 font-semibold">{o.customerName}</p>
            <p className="tabular-nums">{o.phone}</p>
            {o.shipTo ? (
              <address className="mt-1 break-words not-italic">
                {o.shipTo.line1}
                {o.shipTo.line2 && <><br />{o.shipTo.line2}</>}
                {o.shipTo.landmark && <><br />Near {o.shipTo.landmark}</>}
                <br />
                {o.shipTo.city}, {o.shipTo.state} <span className="font-semibold tabular-nums">{o.shipTo.pincode}</span>
              </address>
            ) : (
              <p className="mt-1 whitespace-pre-line break-words">{o.address}</p>
            )}
          </div>
          <div className="sm:text-right print:text-right">
            <p className="text-xs font-semibold uppercase">Payment</p>
            <p className="mt-1 text-base font-bold">
              {o.codToCollectPaise > 0 ? <>Collect <span className="tabular-nums">{formatINR(o.codToCollectPaise)}</span> in cash</> : o.paymentStatus === "paid" ? "Paid. Collect nothing." : "Not paid yet"}
            </p>
            {o.trackingNumber && <p className="mt-2 break-all tabular-nums">Tracking: {o.trackingNumber}</p>}
          </div>
        </div>

        {o.notes && (
          <p className="mt-4 border border-black px-3 py-2 text-sm">
            <span className="font-semibold">Customer note:</span> {o.notes}
          </p>
        )}

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black text-left">
              <th scope="col" className="w-10 py-1.5 pr-2">Packed</th>
              <th scope="col" className="py-1.5 pr-2">Item</th>
              <th scope="col" className="py-1.5 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it) => (
              <tr key={it.id} className="border-b border-black/30">
                <td className="py-2 pr-2">
                  <span className="block h-4 w-4 border border-black" aria-hidden="true" />
                </td>
                <td className="py-2 pr-2">{it.name}</td>
                <td className="py-2 text-right text-base font-semibold tabular-nums">{it.qty}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="py-2 pr-2 text-right font-semibold">Total units</td>
              <td className="py-2 text-right text-base font-bold tabular-nums">{o.items.reduce((n, it) => n + it.qty, 0)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-6 text-xs">Shipped by RUXs. Questions about this order? Open it in the RUXs app under Orders.</p>
      </article>
    </div>
  );
}
