import Link from "next/link";
import { formatINR } from "@/core/money";
import { getCustomerBillByToken } from "@/features/billing/queries";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CustomerMonthlyBillPage({
  params,
}: {
  params: Promise<{ token: string; month: string }>;
}) {
  const { token, month } = await params;
  const billData = await getCustomerBillByToken(token, month);

  if (!billData) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Link
          href={`/c/${token}`}
          className="text-xs text-muted hover:text-ink font-medium"
        >
          ← Back to Schedule
        </Link>
        <EmptyState
          title={`No bill for ${month}`}
          description="A monthly bill has not been generated for this period yet. Bills are automatically generated on the 1st of each month."
          icon="bill"
          action={
            <Link
              href={`/c/${token}`}
              className="inline-block px-4 py-2 bg-accent text-white text-xs font-semibold rounded-[10px]"
            >
              Return to Household Page
            </Link>
          }
        />
      </div>
    );
  }

  const { invoice, customer, vendor, upiUrl, entries } = billData;
  const isPaid = invoice.status === "paid";

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Back Link */}
      <div>
        <Link
          href={`/c/${token}`}
          className="text-xs text-muted hover:text-ink font-medium"
        >
          ← Back to Schedule
        </Link>
      </div>

      {/* Bill Header Card */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-3 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted block">{vendor.name}</span>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Monthly Bill • {invoice.period}
            </h1>
            <div className="text-xs text-muted mt-0.5">
              Invoice #{invoice.number} • {customer.name} (Flat {customer.flat})
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              isPaid
                ? "bg-[#E1F3E7] text-good"
                : invoice.closingPaise <= 0
                  ? "bg-[#E1F3E7] text-good"
                  : "bg-[#FFF3C9] text-[#9A5B00]"
            }`}
          >
            {isPaid ? "Paid in Full" : invoice.closingPaise <= 0 ? "Cleared" : "Payment Due"}
          </span>
        </div>

        {/* Bill Summary Breakdown */}
        <div className="pt-3 border-t border-line/60 space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-line/40">
            <span className="text-muted">Opening Balance</span>
            <span className="font-mono text-ink">
              {formatINR(invoice.openingPaise)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-line/40">
            <span className="text-muted">Charges this Month</span>
            <span className="font-mono text-ink font-semibold">
              +{formatINR(invoice.chargesPaise)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-line/40">
            <span className="text-muted">Payments Received</span>
            <span className="font-mono text-good font-semibold">
              -{formatINR(invoice.paymentsPaise)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-sm font-bold">
            <span className="text-ink">Total Due</span>
            <span
              className={`font-mono tabular-nums ${
                invoice.closingPaise > 0 ? "text-[#B42318]" : "text-good"
              }`}
            >
              {formatINR(invoice.closingPaise)}
            </span>
          </div>
        </div>

        {/* UPI Button */}
        {upiUrl && (
          <div className="pt-2">
            <a
              href={upiUrl}
              className="w-full min-h-[44px] py-3 px-4 bg-accent text-white font-semibold text-xs rounded-[10px] text-center hover:opacity-90 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Pay {formatINR(invoice.closingPaise)} via UPI App</span>
            </a>
            <p className="text-[11px] text-muted text-center mt-1.5">
              Opens Google Pay, PhonePe, Paytm, or any UPI app. Paid directly to {vendor.name}.
            </p>
          </div>
        )}
      </div>

      {/* Itemised Transactions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Itemised Deliveries & Events</h2>

        {entries.length === 0 ? (
          <div className="p-4 bg-surface border border-line rounded-[12px] text-xs text-muted text-center">
            No entries for this period.
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-[12px] divide-y divide-line overflow-hidden shadow-xs">
            {entries.map((entry) => {
              const isDebit = entry.amountPaise > 0;
              return (
                <div
                  key={entry.id}
                  className="p-3.5 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-ink">
                      {entry.notes || entry.type.replace("_", " ")}
                    </div>
                    <div className="text-[11px] text-muted">
                      {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        timeZone: "Asia/Kolkata",
                      })}
                    </div>
                  </div>

                  <div
                    className={`font-mono font-bold tabular-nums ${
                      isDebit ? "text-ink" : "text-good"
                    }`}
                  >
                    {isDebit ? `+${formatINR(entry.amountPaise)}` : `-${formatINR(Math.abs(entry.amountPaise))}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
