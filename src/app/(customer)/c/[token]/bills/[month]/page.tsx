import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatINR } from "@/core/money";
import { istDateTime, IST_TIMEZONE } from "@/core/time";
import { getCustomerBillByToken } from "@/features/billing/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass, ButtonLink } from "@/components/ui/button";

/** Billing periods are stored as YYYY-MM. */
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const entryDateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: IST_TIMEZONE,
});

function periodLabel(period: string): string {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: IST_TIMEZONE }).format(
    istDateTime(`${period}-01`, "12:00:00")
  );
}

function BackLink({ token }: { token: string }) {
  return (
    <Link
      href={`/c/${token}`}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-control text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to schedule
    </Link>
  );
}

export default async function CustomerMonthlyBillPage({
  params,
}: {
  params: Promise<{ token: string; month: string }>;
}) {
  const { token, month } = await params;
  if (!PERIOD_RE.test(month)) {
    notFound();
  }

  const billData = await getCustomerBillByToken(token, month);
  const label = periodLabel(month);

  if (!billData) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <BackLink token={token} />
        <EmptyState
          title={`No bill for ${label} yet`}
          description="Bills are generated on the 1st of each month. Your running balance is on the schedule page."
          icon="bill"
          action={
            <ButtonLink href={`/c/${token}`} size="sm">
              Back to schedule
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const { invoice, customer, vendor, upiUrl, entries } = billData;
  const isPaid = invoice.status === "paid";
  const isCleared = !isPaid && invoice.closingPaise <= 0;
  const statusLabel = isPaid ? "Paid in full" : isCleared ? "Cleared" : "Payment due";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BackLink token={token} />

      <Card className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-xs text-muted">{vendor.name}</p>
            <h1 className="text-xl font-bold tracking-tight text-ink">Bill for {label}</h1>
            <p className="mt-0.5 break-words text-xs text-muted">
              Invoice #{invoice.number} · {customer.name} (Flat {customer.flat})
            </p>
          </div>
          <Badge tone={isPaid || isCleared ? "good" : "warn"} className="shrink-0">
            {statusLabel}
          </Badge>
        </div>

        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <dt className="text-muted">Opening balance</dt>
            <dd className="font-mono tabular-nums text-ink">{formatINR(invoice.openingPaise)}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <dt className="text-muted">Charges this month</dt>
            <dd className="font-mono font-semibold tabular-nums text-ink">+{formatINR(invoice.chargesPaise)}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <dt className="text-muted">Payments received</dt>
            <dd className="font-mono font-semibold tabular-nums text-good">−{formatINR(invoice.paymentsPaise)}</dd>
          </div>
          <div className="flex items-center justify-between pt-1 text-base font-bold">
            <dt className="text-ink">Total due</dt>
            <dd className={`font-mono tabular-nums ${invoice.closingPaise > 0 ? "text-bad" : "text-good"}`}>
              {formatINR(invoice.closingPaise)}
            </dd>
          </div>
        </dl>

        {upiUrl ? (
          <div className="space-y-1.5">
            <a href={upiUrl} className={buttonClass("primary", "lg", "w-full")}>
              Pay {formatINR(invoice.closingPaise)} via UPI
            </a>
            <p className="text-center text-xs text-muted">
              Opens Google Pay, PhonePe, Paytm or any UPI app. Paid directly to {vendor.name}.
            </p>
          </div>
        ) : null}
      </Card>

      <section aria-labelledby="entries-heading" className="space-y-3">
        <h2 id="entries-heading" className="text-sm font-semibold text-ink">
          Deliveries, skips and payments
        </h2>

        {entries.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted">No entries for this month.</Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {entries.map((entry) => {
                const isDebit = entry.amountPaise > 0;
                return (
                  <li key={entry.id} className="flex items-start justify-between gap-3 p-3.5 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p className="break-words font-medium text-ink first-letter:uppercase">
                        {entry.notes || entry.type.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        {entryDateFormat.format(new Date(entry.createdAt))}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 font-mono font-bold tabular-nums ${isDebit ? "text-ink" : "text-good"}`}
                    >
                      {isDebit ? `+${formatINR(entry.amountPaise)}` : `−${formatINR(Math.abs(entry.amountPaise))}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
