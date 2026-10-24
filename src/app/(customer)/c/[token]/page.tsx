import { UiIcon } from "@/components/ui/app-icon";
import Link from "next/link";
import { eq, and, or, isNull, gte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions, products, ledgerEntries, assetMovements, dayChanges } from "@/db/schema";
import { requireCustomerByToken } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import { balance } from "@/core/ledger";
import { canBalance } from "@/core/assets";
import { buildUpiUrl } from "@/core/upi";
import { todayIST, weekdayIST } from "@/core/time";
import { CustomerDayCards } from "@/features/day-changes/components/customer-day-cards";
import { PauseDatesSheet } from "@/features/day-changes/components/pause-dates-sheet";

export default async function CustomerLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { customer, vendor } = await requireCustomerByToken(token);
  const db = getDb();
  const today = todayIST();
  const currentPeriod = today.substring(0, 7);

  // 1. Fetch active subscriptions
  const subs = await db
    .select({
      sub: subscriptions,
      product: products,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(
      and(
        eq(subscriptions.customerId, customer.id),
        or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))
      )
    );

  // 2. Fetch ledger balance
  const ledger = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.customerId, customer.id));
  const currentBalance = balance(ledger);

  // 3. Fetch cans/assets
  const movements = await db
    .select()
    .from(assetMovements)
    .where(eq(assetMovements.customerId, customer.id));
  const cansHeld = canBalance(movements);

  // 4. Fetch day changes strictly for this customer's subscriptions
  const subIds = subs.map((s) => s.sub.id);
  const changes =
    subIds.length > 0
      ? await db
          .select()
          .from(dayChanges)
          .where(
            and(
              eq(dayChanges.vendorId, vendor.id),
              inArray(dayChanges.subscriptionId, subIds)
            )
          )
      : [];

  // Build next 7 days in IST
  const days: {
    dateStr: string;
    dayLabel: string;
    dayNum: string;
    weekday: string;
    isToday: boolean;
  }[] = [];
  const startMoment = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(startMoment);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" });
    const dayNum = d.toLocaleDateString("en-US", { day: "numeric", timeZone: "Asia/Kolkata" });
    const weekday = weekdayIST(dateStr);

    days.push({
      dateStr,
      dayLabel,
      dayNum,
      weekday,
      isToday: i === 0,
    });
  }

  // Universal UPI payment deep link
  const upiUrl =
    vendor.upiVpa && currentBalance > 0
      ? buildUpiUrl({
          vpa: vendor.upiVpa,
          payeeName: vendor.name,
          amountPaise: currentBalance,
          billNumber: `RX-${customer.flat}`,
        })
      : null;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-3 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted block">Direct Kitchen Service</span>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {vendor.name}
            </h1>
            <div className="text-xs text-muted mt-0.5">
              {customer.name} • Flat {customer.flat}, {customer.society}
            </div>
          </div>

          <a
            href={`tel:${vendor.phone}`}
            className="px-2.5 py-1 bg-[#FAFAF7] border border-line rounded-[8px] text-xs font-semibold text-ink"
          >
            <UiIcon name="phone" /> Kitchen
          </a>
        </div>

        {/* Khata Balance & UPI Pay button */}
        <div className="pt-3 border-t border-line/60 grid grid-cols-2 gap-2">
          <div className="p-3 bg-[#FAFAF7] rounded-[10px]">
            <span className="text-[11px] text-muted block">Current Khata</span>
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                currentBalance > 0 ? "text-[#B42318]" : "text-good"
              }`}
            >
              {formatINR(currentBalance)}
            </span>
          </div>

          <div className="p-3 bg-[#FAFAF7] rounded-[10px]">
            <span className="text-[11px] text-muted block">Cans / Dabbas</span>
            <span className="text-lg font-bold font-mono tabular-nums text-ink">
              {cansHeld}
            </span>
          </div>
        </div>

        {upiUrl && (
          <a
            href={upiUrl}
            className="w-full min-h-[44px] py-2.5 px-4 bg-accent text-white font-semibold text-xs rounded-[10px] text-center hover:opacity-90 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Pay {formatINR(currentBalance)} via UPI</span>
          </a>
        )}
      </div>

      {/* Holiday Pause Button */}
      <div>
        <PauseDatesSheet token={token} defaultStart={today} />
      </div>

      {/* 7-Day Calendar Cards for Deliver / Skip / Extra */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Upcoming Schedule
            </h2>
            <p className="text-xs text-muted">
              Tap to skip or add extras. Changes set before cutoff are free.
            </p>
          </div>
        </div>

        {subs.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted bg-surface border border-line rounded-[12px]">
            No subscriptions linked yet. Contact your kitchen to activate your meal plan.
          </div>
        ) : (
          subs.map(({ sub, product }) => (
            <div key={sub.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-ink">
                  {product.name} ({product.shift})
                </span>
                <span className="text-[11px] text-muted">
                  Cutoff: {product.cutoffAt} IST
                </span>
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
      </div>

      {/* View Itemised Monthly Bill Link */}
      <div className="p-4 bg-surface border border-line rounded-[12px] space-y-2 text-xs">
        <h3 className="font-semibold text-ink">Monthly Itemised Bill</h3>
        <p className="text-muted leading-relaxed">
          View full ledger breakdown of daily deliveries, skips, and payments.
        </p>
        <Link
          href={`/c/${token}/bills/${currentPeriod}`}
          className="inline-block pt-1 font-semibold text-accent hover:underline"
        >
          View {currentPeriod} Bill Breakdown →
        </Link>
      </div>
    </div>
  );
}
