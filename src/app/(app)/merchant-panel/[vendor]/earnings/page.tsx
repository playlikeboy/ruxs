import { requireVendorModule } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import { getVendorEarnings } from "@/features/payouts/queries";
import { RequestWithdrawalButton } from "@/features/payouts/components/payout-buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Earnings" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

const PAYOUT_TONE: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  requested: "warn",
  paid: "good",
  rejected: "bad",
};

export default async function EarningsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  await requireVendorModule(slug, "earnings", ["owner", "staff"]);
  const { access, balance, recent, payouts } = await getVendorEarnings(slug);
  const hasOpenRequest = payouts.some((p) => p.status === "requested");

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader title="Earnings" description="Online payments RUXs collected for you. Withdraw once a month." />

      <section aria-labelledby="earnings-available" className="rounded-card bg-ink p-5 text-white lg:max-w-xl">
        <h2 id="earnings-available" className="text-sm text-white/75">Available to withdraw</h2>
        <p className="mt-1 break-words text-4xl font-bold tabular-nums">{formatINR(balance.availablePaise)}</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div><dt className="text-white/75">Earned</dt><dd className="font-semibold tabular-nums">{formatINR(balance.settledPaise)}</dd></div>
          <div><dt className="text-white/75">RUXs fee</dt><dd className="font-semibold tabular-nums">{formatINR(balance.feePaise)}</dd></div>
          <div><dt className="text-white/75">Withdrawn</dt><dd className="font-semibold tabular-nums">{formatINR(balance.withdrawnPaise)}</dd></div>
        </dl>
        {balance.pendingPaise > 0 && (
          <p className="mt-3 text-xs text-white/80">+ {formatINR(balance.pendingPaise)} from paid orders not delivered yet. It becomes available on delivery.</p>
        )}
        <div className="mt-4">
          {access.role !== "owner" ? (
            <p className="text-xs text-white/75">Only the owner can request a withdrawal.</p>
          ) : hasOpenRequest ? (
            <p className="rounded-control bg-white/10 px-3 py-2 text-sm">Withdrawal of {formatINR(balance.requestedPaise)} requested. RUXs transfers it to {access.vendor.upiVpa} and marks it paid.</p>
          ) : balance.availablePaise >= 100 ? (
            <RequestWithdrawalButton slug={slug} label={`Withdraw ${formatINR(balance.availablePaise)}`} />
          ) : (
            <p className="text-xs text-white/75">Nothing to withdraw yet.</p>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Withdrawals</h2>
        {payouts.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-4 text-sm text-muted">No withdrawals yet.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="font-bold tabular-nums text-ink">{formatINR(p.amountPaise)}</p>
                  <p className="text-xs text-muted">
                    Requested {dateFmt.format(p.requestedAt)}
                    {p.reference ? ` · Ref ${p.reference}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <Badge tone={PAYOUT_TONE[p.status] ?? "neutral"} className="shrink-0 capitalize">{p.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Online payments</h2>
        {recent.length === 0 ? (
          <EmptyState title="No online payments yet" description="When households pay online for orders or monthly bills, the money shows here." icon="bill" />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {recent.map(({ payment, customerName, orderNumber, orderStatus, bookingNumber, bookingStatus, serviceName }) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{customerName}</p>
                  <p className="text-xs text-muted">
                    {payment.purpose === "dues"
                      ? "Bill payment"
                      : payment.purpose === "booking"
                        ? `${serviceName ?? "Session"} · ${bookingNumber ?? ""} · ${bookingStatus?.replaceAll("_", "-") ?? ""}`
                        : `Order ${orderNumber ?? ""} · ${orderStatus ?? ""}`}
                    {payment.paidAt ? ` · ${dateFmt.format(payment.paidAt)}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-bold tabular-nums text-ink">{formatINR(payment.amountPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
