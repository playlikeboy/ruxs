import Link from "next/link";
import { formatINR } from "@/core/money";
import { getAdminPayouts } from "@/features/payouts/queries";
import {
  MarkPayoutPaidButton,
  RecordPayoutButton,
  RefundBookingButton,
  RefundOrderButton,
  RejectPayoutButton,
} from "@/features/payouts/components/payout-buttons";

export const metadata = { title: "Payouts" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export default async function AdminPayoutsPage() {
  const { balances, requests, refunds, bookingRefunds } = await getAdminPayouts();
  const open = requests.filter((r) => r.payout.status === "requested");
  const done = requests.filter((r) => r.payout.status !== "requested");
  const owed = balances.reduce((s, b) => s + b.balance.availablePaise, 0);
  const pending = balances.reduce((s, b) => s + b.balance.pendingPaise, 0);
  const fees = balances.reduce((s, b) => s + b.balance.feePaise, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-muted">Money collected through Razorpay, what each vendor can withdraw, and transfers you have made.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] bg-ink p-5 text-white">
          <p className="text-xs uppercase tracking-wider opacity-70">Owed to vendors now</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{formatINR(owed)}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Paid, awaiting delivery</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{formatINR(pending)}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted">RUXs fees earned</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{formatINR(fees)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Withdrawal requests ({open.length})</h2>
        {open.length === 0 ? (
          <p className="rounded-[12px] border border-line bg-surface p-4 text-sm text-muted">No open requests.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface">
            {open.map(({ payout, vendorName, upiVpa }) => (
              <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold">{vendorName} · <span className="font-mono">{formatINR(payout.amountPaise)}</span></p>
                  <p className="text-xs text-muted">Send to UPI <span className="font-mono text-ink">{upiVpa}</span> · requested {dateFmt.format(payout.requestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <RejectPayoutButton payoutId={payout.id} />
                  <MarkPayoutPaidButton payoutId={payout.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {bookingRefunds.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-bad">Booking refunds due ({bookingRefunds.length})</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-bad/30 bg-surface">
            {bookingRefunds.map(({ booking, vendorName, payment }) => (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold">{booking.number} · {vendorName}</p>
                  <p className="text-xs text-muted">{booking.cancelReason ?? "Cancelled"}</p>
                </div>
                <RefundBookingButton bookingId={booking.id} amountLabel={formatINR(payment.amountPaise)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {refunds.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-bad">Refunds due ({refunds.length})</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-bad/30 bg-surface">
            {refunds.map(({ order, vendorName, payment }) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold">{order.number} · {vendorName}</p>
                  <p className="text-xs text-muted">{order.status} · {order.cancelReason ?? ""}</p>
                </div>
                <RefundOrderButton orderId={order.id} amountLabel={formatINR(payment.amountPaise)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Vendor balances</h2>
        <ul className="space-y-2 md:hidden">
          {balances.map(({ vendor, balance }) => (
            <li key={vendor.id} className="rounded-[14px] border border-line bg-surface p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/vendors/${vendor.id}`} className="font-semibold">{vendor.name}</Link>
                <span className="font-mono font-bold tabular-nums">{formatINR(balance.availablePaise)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Earned {formatINR(balance.settledPaise)} · fee {formatINR(balance.feePaise)} · pending {formatINR(balance.pendingPaise)} · withdrawn {formatINR(balance.withdrawnPaise)}
              </p>
              {balance.availablePaise >= 100 && balance.requestedPaise === 0 && (
                <div className="mt-3"><RecordPayoutButton vendorId={vendor.id} amountLabel={formatINR(balance.availablePaise)} /></div>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-[12px] border border-line bg-surface md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 text-right font-semibold">Earned</th>
                <th className="px-4 py-3 text-right font-semibold">Fee</th>
                <th className="px-4 py-3 text-right font-semibold">Pending</th>
                <th className="px-4 py-3 text-right font-semibold">Withdrawn</th>
                <th className="px-4 py-3 text-right font-semibold">Available</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {balances.map(({ vendor, balance }) => (
                <tr key={vendor.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/vendors/${vendor.id}`} className="font-medium hover:underline">{vendor.name}</Link>
                    <p className="font-mono text-xs text-muted">{vendor.upiVpa} · fee {vendor.commissionBps / 100}%</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatINR(balance.settledPaise)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatINR(balance.feePaise)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatINR(balance.pendingPaise)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatINR(balance.withdrawnPaise)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">{formatINR(balance.availablePaise)}</td>
                  <td className="px-4 py-3 text-right">
                    {balance.availablePaise >= 100 && balance.requestedPaise === 0 && (
                      <RecordPayoutButton vendorId={vendor.id} amountLabel={formatINR(balance.availablePaise)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">History</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface text-sm">
            {done.map(({ payout, vendorName }) => (
              <li key={payout.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>{vendorName} · <span className="font-mono">{formatINR(payout.amountPaise)}</span></span>
                <span className="text-xs text-muted capitalize">{payout.status}{payout.reference ? ` · ${payout.reference}` : ""}{payout.processedAt ? ` · ${dateFmt.format(payout.processedAt)}` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
