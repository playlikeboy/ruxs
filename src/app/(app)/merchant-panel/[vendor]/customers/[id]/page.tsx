import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { formatINR } from "@/core/money";
import { todayIST } from "@/core/time";
import { getCustomerDetails } from "@/features/customers/queries";
import { AddAdjustmentDialog } from "@/features/customers/components/add-adjustment-dialog";
import { ResetLinkButton } from "@/features/customers/components/reset-link-button";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Customer" };

const ledgerDateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const LEDGER_TONE: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  payment: "good",
  late_fee: "warn",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ vendor: string; id: string }>;
}) {
  const { vendor: slug, id } = await params;
  // Same roles as the nav: the khata and adjustments are desk work, not for drivers.
  await requireVendorModule(slug, "customers", ["owner", "staff"]);
  const data = await getCustomerDetails(slug, id);

  if (!data) {
    notFound();
  }

  const { customer, subscriptions, ledger, balancePaise, canHoldings } = data;
  const today = todayIST();
  const activeCount = subscriptions.filter(({ sub }) => !sub.endsOn || sub.endsOn >= today).length;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link href={`/merchant-panel/${slug}/customers`} className="text-sm font-semibold text-muted hover:text-ink">
        ← Customers
      </Link>

      <section className="space-y-3 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{customer.name}</h1>
            <p className="mt-0.5 text-sm font-medium text-ink">
              Flat {customer.flat}
              {customer.tower ? `, Tower ${customer.tower}` : ""}
              {customer.floor ? ` (Floor ${customer.floor})` : ""}
            </p>
            <p className="mt-0.5 text-sm text-muted">{customer.society}</p>
          </div>

          <a href={`tel:${customer.phone}`} className={buttonClass("secondary", "sm", "tabular-nums")}>
            <Phone className="h-4 w-4" aria-hidden="true" /> {customer.phone}
          </a>
        </div>

        <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div className="rounded-control bg-app-canvas p-3">
            <dt className="text-xs text-muted">Khata balance</dt>
            <dd
              className={`text-lg font-bold tabular-nums ${
                balancePaise > 0 ? "text-bad" : balancePaise < 0 ? "text-good" : "text-ink"
              }`}
            >
              {formatINR(balancePaise)}
            </dd>
          </div>

          <div className="rounded-control bg-app-canvas p-3">
            <dt className="text-xs text-muted">Cans / assets held</dt>
            <dd className="text-lg font-bold tabular-nums text-ink">{canHoldings}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Subscriptions</h2>
          <span className="text-xs tabular-nums text-muted">{activeCount} active</span>
        </div>

        {subscriptions.length === 0 ? (
          <p className="py-2 text-sm text-muted">No subscriptions for this household yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {subscriptions.map(({ sub, product }) => {
              const ended = !!sub.endsOn && sub.endsOn < today;
              return (
                <li key={sub.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium text-ink">
                      <span className="truncate">{product.name}</span>
                      {ended && <Badge>Ended</Badge>}
                    </p>
                    <p className="text-xs text-muted">
                      Qty {sub.qty} · {sub.days.length === 7 ? "Daily" : sub.days.join(", ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{formatINR(product.pricePaise)} each</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Khata history</h2>
            <p className="text-sm text-muted">Entries are never edited. Corrections are added as new entries.</p>
          </div>

          <AddAdjustmentDialog slug={slug} customerId={customer.id} customerName={customer.name} />
        </div>

        {ledger.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
            No khata entries recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {ledger.map((entry) => {
              const isDebit = entry.amountPaise > 0; // Household owes more
              return (
                <li key={entry.id} className="flex items-start justify-between gap-3 p-3.5 text-sm">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={LEDGER_TONE[entry.type] ?? "neutral"} className="capitalize">
                        {entry.type.replaceAll("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted">{ledgerDateFmt.format(new Date(entry.createdAt))}</span>
                    </div>
                    {entry.notes && <p className="pt-0.5 text-sm text-ink">{entry.notes}</p>}
                  </div>

                  <span className={`shrink-0 font-bold tabular-nums ${isDebit ? "text-ink" : "text-good"}`}>
                    {isDebit ? `+${formatINR(entry.amountPaise)}` : `-${formatINR(Math.abs(entry.amountPaise))}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-card border border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">Private link</h2>
        <p className="text-sm leading-relaxed text-muted">
          The household uses their private link to see their calendar and bills, and to skip or pause deliveries.
        </p>
        <div className="pt-1">
          <ResetLinkButton slug={slug} customerId={customer.id} />
        </div>
      </section>
    </div>
  );
}
