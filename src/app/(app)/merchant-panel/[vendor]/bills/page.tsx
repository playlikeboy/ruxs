import Link from "next/link";
import { formatINR } from "@/core/money";
import { todayIST } from "@/core/time";
import { getVendorBills } from "@/features/billing/queries";
import { MarkPaidDialog } from "@/features/billing/components/mark-paid-dialog";
import { GenerateBillsButton } from "@/features/billing/components/generate-bills-button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function BillsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const today = todayIST();
  const currentPeriod = today.substring(0, 7);

  const bills = await getVendorBills(slug);

  return (
    <div className="max-w-3xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Bills & Khata
          </h1>
          <p className="text-xs text-muted">
            Monthly itemised invoices computed from the append-only ledger
          </p>
        </div>

        <GenerateBillsButton slug={slug} defaultPeriod={currentPeriod} />
      </div>

      {bills.length === 0 ? (
        <EmptyState
          title="No bills generated yet"
          description="Bills are automatically generated on the 1st at 10:00 IST by the cron or you can generate them now."
          icon="bill"
          action={<GenerateBillsButton slug={slug} defaultPeriod={currentPeriod} />}
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

                    <div className="text-xs text-muted mt-0.5">
                      {invoice.number} • Period:{" "}
                      <Link
                        href={`/merchant-panel/${slug}/bills/${invoice.period}`}
                        className="hover:underline text-accent font-medium"
                      >
                        {invoice.period}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        isPaid
                          ? "bg-[#E1F3E7] text-good"
                          : isPartiallyPaid
                            ? "bg-[#FFF3C9] text-[#9A5B00]"
                            : invoice.status === "sent"
                              ? "bg-[#E2EEFA] text-ink"
                              : "bg-[#FAFAF7] text-muted border border-line"
                      }`}
                    >
                      {invoice.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted block text-[11px]">Charges</span>
                    <span className="font-semibold text-ink tabular-nums font-mono">
                      {formatINR(invoice.chargesPaise)}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[11px]">Paid</span>
                    <span className="font-semibold text-good tabular-nums font-mono">
                      {formatINR(invoice.paymentsPaise)}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[11px]">Due</span>
                    <span
                      className={`font-bold tabular-nums font-mono ${
                        invoice.closingPaise > 0 ? "text-[#B42318]" : "text-good"
                      }`}
                    >
                      {formatINR(invoice.closingPaise)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-line/40">
                  <div className="text-xs text-muted">
                    {invoice.paidAt
                      ? `Paid on ${new Date(invoice.paidAt).toLocaleDateString("en-IN")}`
                      : invoice.closingPaise <= 0
                        ? "Cleared"
                        : "Awaiting payment"}
                  </div>

                  {!isPaid && invoice.closingPaise > 0 && (
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
