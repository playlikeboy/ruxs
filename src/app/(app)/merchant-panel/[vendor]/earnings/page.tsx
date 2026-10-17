import { formatINR } from "@/core/money";
import { getVendorEarnings } from "@/features/payouts/queries";
import { RequestWithdrawalButton } from "@/features/payouts/components/payout-buttons";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Earnings" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

const PAYOUT_TONE: Record<string, string> = {
  requested: "bg-butter text-warn",
  paid: "bg-mint text-good",
  rejected: "bg-blush text-bad",
};

export default async function EarningsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const { access, balance, recent, payouts } = await getVendorEarnings(slug);
  const hasOpenRequest = payouts.some((p) => p.status === "requested");

  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Earnings</h1>
        <p className="mt-0.5 text-sm text-muted">Online payments RUXs collected for you. Withdraw once a month.</p>
      </div>

      <section className="rounded-[16px] bg-ink p-5 text-white lg:max-w-xl">
        <p className="text-xs uppercase tracking-wider opacity-70">Available to withdraw</p>
        <p className="mt-1 font-mono text-4xl font-bold tabular-nums">{formatINR(balance.availablePaise)}</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div><dt className="opacity-70">Earned</dt><dd className="font-mono font-semibold tabular-nums">{formatINR(balance.settledPaise)}</dd></div>
          <div><dt className="opacity-70">RUXs fee</dt><dd className="font-mono font-semibold tabular-nums">{formatINR(balance.feePaise)}</dd></div>
          <div><dt className="opacity-70">Withdrawn</dt><dd className="font-mono font-semibold tabular-nums">{formatINR(balance.withdrawnPaise)}</dd></div>
        </dl>
        {balance.pendingPaise > 0 && (
          <p className="mt-3 text-xs opacity-80">+ {formatINR(balance.pendingPaise)} from paid orders not delivered yet. It becomes available on delivery.</p>
        )}
        <div className="mt-4">
          {access.role !== "owner" ? (
            <p className="text-xs opacity-70">Only the owner can request a withdrawal.</p>
          ) : hasOpenRequest ? (
            <p className="rounded-[10px] bg-white/10 px-3 py-2 text-sm">Withdrawal of {formatINR(balance.requestedPaise)} requested. RUXs transfers it to {access.vendor.upiVpa} and marks it paid.</p>
          ) : balance.availablePaise >= 100 ? (
            <RequestWithdrawalButton slug={slug} label={`Withdraw ${formatINR(balance.availablePaise)}`} />
          ) : (
            <p className="text-xs opacity-70">Nothing to withdraw yet.</p>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Withdrawals</h2>
        {payouts.length === 0 ? (
          <p className="rounded-[12px] border border-line bg-surface p-4 text-sm text-muted">No withdrawals yet.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-mono font-bold tabular-nums text-ink">{formatINR(p.amountPaise)}</p>
                  <p className="text-xs text-muted">
                    Requested {dateFmt.format(p.requestedAt)}
                    {p.reference ? ` · Ref ${p.reference}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize " + (PAYOUT_TONE[p.status] ?? "")}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Online payments</h2>
        {recent.length === 0 ? (
          <EmptyState title="No online payments yet" description="When households pay online for orders or monthly bills, the money shows here." icon="bill" />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
            {recent.map(({ payment, customerName, orderNumber, orderStatus, bookingNumber, bookingStatus, serviceName }) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{customerName}</p>
                  <p className="text-xs text-muted">
                    {payment.purpose === "dues"
                      ? "Bill payment"
                      : payment.purpose === "booking"
                        ? `${serviceName ?? "Session"} · ${bookingNumber ?? ""} · ${bookingStatus?.replace("_", "-") ?? ""}`
                        : `Order ${orderNumber ?? ""} · ${orderStatus ?? ""}`}
                    {payment.paidAt ? ` · ${dateFmt.format(payment.paidAt)}` : ""}
                  </p>
                </div>
                <span className="font-mono font-bold tabular-nums text-ink">{formatINR(payment.amountPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
