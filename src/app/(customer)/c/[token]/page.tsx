import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { eq, and, or, isNull, gte, lte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions, products, ledgerEntries, assetMovements, dayChanges } from "@/db/schema";
import { requireCustomerByToken } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import { balance } from "@/core/ledger";
import { canBalance } from "@/core/assets";
import { buildUpiUrl } from "@/core/upi";
import { addDaysIST, istDateTime, IST_TIMEZONE, todayIST, weekdayIST } from "@/core/time";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { CustomerDayCards } from "@/features/day-changes/components/customer-day-cards";
import { PauseDatesSheet } from "@/features/day-changes/components/pause-dates-sheet";

const SCHEDULE_DAYS = 7;
const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: IST_TIMEZONE });
const dayNumFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: IST_TIMEZONE });
const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: IST_TIMEZONE });

export default async function CustomerLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { customer, vendor } = await requireCustomerByToken(token);
  const db = getDb();
  const today = todayIST();
  const lastDay = addDaysIST(today, SCHEDULE_DAYS - 1);
  const currentPeriod = today.substring(0, 7);

  // 1. Active subscriptions for this customer (scoped to the link's vendor).
  const subs = await db
    .select({
      sub: subscriptions,
      product: products,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(
      and(
        eq(subscriptions.vendorId, vendor.id),
        eq(subscriptions.customerId, customer.id),
        or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))
      )
    );

  // 2. Ledger balance (only the amounts are needed).
  const ledger = await db
    .select({ amountPaise: ledgerEntries.amountPaise })
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.vendorId, vendor.id), eq(ledgerEntries.customerId, customer.id)));
  const currentBalance = balance(ledger);

  // 3. Cans / dabbas held.
  const movements = await db
    .select({ delta: assetMovements.delta })
    .from(assetMovements)
    .where(and(eq(assetMovements.vendorId, vendor.id), eq(assetMovements.customerId, customer.id)));
  const cansHeld = canBalance(movements);

  // 4. Day changes for this customer's subscriptions inside the visible window.
  //    Only the fields the client cards need are selected so nothing else is serialised to the browser.
  const subIds = subs.map((s) => s.sub.id);
  const changes =
    subIds.length > 0
      ? await db
          .select({
            subscriptionId: dayChanges.subscriptionId,
            serviceDate: dayChanges.serviceDate,
            kind: dayChanges.kind,
            qty: dayChanges.qty,
            isLate: dayChanges.isLate,
          })
          .from(dayChanges)
          .where(
            and(
              eq(dayChanges.vendorId, vendor.id),
              inArray(dayChanges.subscriptionId, subIds),
              gte(dayChanges.serviceDate, today),
              lte(dayChanges.serviceDate, lastDay)
            )
          )
      : [];

  // Next 7 service dates in IST, built from the IST calendar date (not the server clock's zone).
  const days = Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
    const dateStr = addDaysIST(today, i);
    const noon = istDateTime(dateStr, "12:00:00");
    return {
      dateStr,
      dayLabel: weekdayFormat.format(noon),
      dayNum: dayNumFormat.format(noon),
      weekday: weekdayIST(dateStr),
      isToday: i === 0,
    };
  });

  const upiUrl =
    vendor.upiVpa && currentBalance > 0
      ? buildUpiUrl({
          vpa: vendor.upiVpa,
          payeeName: vendor.name,
          amountPaise: currentBalance,
          billNumber: `RX-${customer.flat}`,
        })
      : null;

  const balanceStatus = currentBalance > 0 ? "Due" : currentBalance < 0 ? "In credit" : "Settled";
  const periodLabel = monthFormat.format(istDateTime(`${currentPeriod}-01`, "12:00:00"));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Card className="space-y-4 p-4">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold tracking-tight text-ink">{vendor.name}</h1>
          <p className="mt-1 break-words text-xs text-muted">
            {customer.name} · Flat {customer.flat}, {customer.society}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 border-t border-line pt-4">
          <div className="rounded-control bg-bg p-3">
            <dt className="text-xs text-muted">Khata balance</dt>
            <dd className="mt-0.5">
              <span
                className={`block font-mono text-lg font-bold tabular-nums ${
                  currentBalance > 0 ? "text-bad" : "text-good"
                }`}
              >
                {formatINR(currentBalance)}
              </span>
              <span className="text-xs text-muted">{balanceStatus}</span>
            </dd>
          </div>

          <div className="rounded-control bg-bg p-3">
            <dt className="text-xs text-muted">Cans / dabbas with you</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums text-ink">{cansHeld}</dd>
          </div>
        </dl>

        {upiUrl ? (
          <a href={upiUrl} className={buttonClass("primary", "lg", "w-full")}>
            Pay {formatINR(currentBalance)} via UPI
          </a>
        ) : null}
      </Card>

      <PauseDatesSheet token={token} defaultStart={today} />

      <section aria-labelledby="schedule-heading" className="space-y-3">
        <div>
          <h2 id="schedule-heading" className="text-base font-semibold text-ink">
            Upcoming schedule
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Skip a day or add extras. Changes made before the cutoff are free.
          </p>
        </div>

        {subs.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            No plans are linked to this page yet. Ask your provider to set one up.
          </Card>
        ) : (
          subs.map(({ sub, product }) => (
            <div key={sub.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-1">
                <h3 className="text-sm font-semibold text-ink">
                  {product.name} <span className="font-normal text-muted">({product.shift})</span>
                </h3>
                <span className="text-xs text-muted tabular-nums">Cutoff {product.cutoffAt} IST</span>
              </div>

              <CustomerDayCards
                token={token}
                todayStr={today}
                days={days}
                subscription={{
                  id: sub.id,
                  qty: sub.qty,
                  days: sub.days,
                  productName: product.name,
                  cutoffAt: product.cutoffAt,
                }}
                initialChanges={changes}
              />
            </div>
          ))
        )}
      </section>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink">Monthly bill</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          See each delivery, skip and payment for the month.
        </p>
        <Link
          href={`/c/${token}/bills/${currentPeriod}`}
          className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-control text-sm font-semibold text-accent hover:underline"
        >
          View {periodLabel} bill
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}
