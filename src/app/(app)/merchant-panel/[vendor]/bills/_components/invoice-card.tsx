import Link from "next/link";
import { formatINR } from "@/core/money";
import { Badge } from "@/components/ui/badge";
import { MarkPaidDialog } from "@/features/billing/components/mark-paid-dialog";
import type { getVendorBills } from "@/features/billing/queries";

type BillRow = Awaited<ReturnType<typeof getVendorBills>>[number];

const STATUS_TONE: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  paid: "good",
  partially_paid: "warn",
  sent: "info",
};

const paidOnFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

/** One customer's monthly statement, shared by the all-bills list and the month view. */
export function InvoiceCard({ slug, bill, showPeriod }: { slug: string; bill: BillRow; showPeriod?: boolean }) {
  const { invoice, customer } = bill;
  const isPaid = invoice.status === "paid";
  const due = invoice.closingPaise > 0;

  return (
    <li className="space-y-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
            <span className="font-semibold text-ink">{customer.name}</span>
            <span className="text-xs text-muted">Flat {customer.flat}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            <span className="tabular-nums">{invoice.number}</span>
            {showPeriod && (
              <>
                {" · "}
                <Link href={`/merchant-panel/${slug}/bills/${invoice.period}`} className="font-medium text-accent hover:underline">
                  {invoice.period}
                </Link>
              </>
            )}
          </p>
        </div>
        <Badge tone={STATUS_TONE[invoice.status] ?? "neutral"} className="shrink-0 capitalize">
          {invoice.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Opening</dt>
          <dd className="tabular-nums text-ink">{formatINR(invoice.openingPaise)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Charges</dt>
          <dd className="tabular-nums text-ink">{formatINR(invoice.chargesPaise)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Paid</dt>
          <dd className="tabular-nums text-good">{formatINR(invoice.paymentsPaise)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Due</dt>
          <dd className={`font-semibold tabular-nums ${due ? "text-bad" : "text-ink"}`}>{formatINR(invoice.closingPaise)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{invoice.paidAt ? `Paid on ${paidOnFmt.format(new Date(invoice.paidAt))}` : due ? "Awaiting payment" : "Cleared"}</span>
          <Link href={`/merchant-panel/${slug}/customers/${customer.id}`} className="font-medium text-accent hover:underline">
            Customer khata →
          </Link>
        </div>

        {!isPaid && due && (
          <MarkPaidDialog
            slug={slug}
            invoiceId={invoice.id}
            customerName={customer.name}
            billNumber={invoice.number}
            closingPaise={invoice.closingPaise}
          />
        )}
      </div>
    </li>
  );
}
