import Link from "next/link";
import { formatINR } from "@/core/money";
import { getVendorBills } from "@/features/billing/queries";
import { MarkPaidDialog } from "@/features/billing/components/mark-paid-dialog";
import { GenerateBillsButton } from "@/features/billing/components/generate-bills-button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function VendorMonthlyBillsPage({
  params,
}: {
  params: Promise<{ vendor: string; month: string }>;
}) {
  const { vendor: slug, month } = await params;
  const bills = await getVendorBills(slug, month);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <Link
          href={`/merchant/${slug}/bills`}
          className="text-xs text-muted hover:text-ink font-medium"
        >
          ← All Bills
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Bills for {month}
          </h1>
          <p className="text-xs text-muted">
            Itemised customer statements computed from the append-only ledger
          </p>
        </div>

        <GenerateBillsButton slug={slug} defaultPeriod={month} />
      </div>

      {bills.length === 0 ? (
        <EmptyState
          title={`No bills generated for ${month}`}
          description="You can generate invoices for all active customer khata accounts now."
          icon="bill"
          action={<GenerateBillsButton slug={slug} defaultPeriod={month} />}
        />
      ) : (
        <div className="space-y-2.5">
          {bills.map(({ invoice, customer }) => {
            const isPaid = invoice.status === "paid";
            const isPartiallyPaid = invoice.status === "partially_paid";

            return (
              <div
                key={invoice.id}
                className="p-4 bg-surface border border-line rounded-[12px] space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-ink">
                        {customer.name}
                      </span>
                      <span className="text-xs font-mono text-muted">
                        Flat {customer.flat}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted block">
                      {invoice.number}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                      isPaid
                        ? "bg-[#E1F3E7] text-good"
                        : isPartiallyPaid
                        ? "bg-[#FFF3C9] text-warn"
                        : "bg-[#FCE4EC] text-bad"
                    }`}
                  >
                    {invoice.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted block">Opening</span>
                    <span className="text-ink">
                      {formatINR(invoice.openingPaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Charges</span>
                    <span className="text-ink">
                      {formatINR(invoice.chargesPaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Paid</span>
                    <span className="text-good">
                      {formatINR(invoice.paymentsPaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Closing</span>
                    <span
                      className={`font-semibold ${
                        invoice.closingPaise > 0 ? "text-bad" : "text-ink"
                      }`}
                    >
                      {formatINR(invoice.closingPaise)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line/60">
                  <Link
                    href={`/merchant/${slug}/customers/${customer.id}`}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Customer Khata →
                  </Link>

                  {!isPaid && (
                    <MarkPaidDialog
                      slug={slug}
                      invoiceId={invoice.id}
                      customerName={customer.name}
                      billNumber={invoice.number}
                      closingPaise={invoice.closingPaise}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
