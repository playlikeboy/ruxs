import Link from "next/link";
import { eq, and, or, isNull, gte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions, products, ledgerEntries, assetMovements, dayChanges } from "@/db/schema";
import { findCustomerByToken } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import { balance } from "@/core/ledger";
import { canBalance } from "@/core/assets";
import { buildUpiUrl } from "@/core/upi";
import { todayIST, weekdayIST } from "@/core/time";
import { CustomerDayCards } from "@/features/day-changes/components/customer-day-cards";
import { PauseDatesSheet } from "@/features/day-changes/components/pause-dates-sheet";
import { ConsumerTokenForm } from "@/features/consumer/components/consumer-token-form";
import { getActiveVendorsWithProducts } from "@/features/vendors/public-queries";
import { NearbyStores } from "@/features/consumer/components/nearby-stores";

export const metadata = {
  title: "Consumer Portal — Everyday Essentials | RUXS",
  description: "Manage your household tiffin and 20L water can subscriptions, daily delivery stops, skips, returnable bottles, and monthly bills.",
};

export default async function ConsumerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token: rawToken } = await searchParams;
  const token = rawToken?.trim();

  // If token is provided, safely lookup customer
  const customerAuth = token ? await findCustomerByToken(token) : null;

  if (customerAuth && token) {
    const { customer, vendor } = customerAuth;
    const db = getDb();
    const today = todayIST();
    const currentPeriod = today.substring(0, 7);

    // Fetch active subscriptions
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

    // Fetch ledger balance
    const ledger = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.customerId, customer.id));
    const currentBalance = balance(ledger);

    // Fetch cans/returnable assets
    const movements = await db
      .select()
      .from(assetMovements)
      .where(eq(assetMovements.customerId, customer.id));
    const cansHeld = canBalance(movements);

    // Fetch day changes strictly for this customer's subscriptions
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

    // Next 7 days in IST
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

    const upiUrl =
      vendor.upiVpa && currentBalance > 0
        ? buildUpiUrl({
            vpa: vendor.upiVpa,
            payeeName: vendor.name,
            amountPaise: currentBalance,
            billNumber: `RX-${customer.flat ?? "APP"}`,
          })
        : null;

    return (
      <div className="mx-auto max-w-lg space-y-5 p-4 sm:p-6 pb-20">
        {/* Top Header Card */}
        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-xs sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                Active Household
              </span>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {customer.name}
              </h1>
              <p className="mt-1 text-xs text-muted">
                {customer.society}
                {customer.tower ? `, ${customer.tower}` : ""}
                {customer.floor ? ` · Floor ${customer.floor}` : ""}
                {customer.flat ? ` · Flat ${customer.flat}` : ""}
              </p>
            </div>
            <Link
              href="/app"
              className="text-xs font-medium text-muted hover:text-ink underline"
            >
              Switch
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
            <span className="text-muted">
              Partner: <strong className="text-ink">{vendor.name}</strong> ({vendor.area})
            </span>
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="font-semibold text-accent hover:underline"
              >
                Call Supplier
              </a>
            )}
          </div>
        </div>

        {/* Khata & Asset Balance Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[14px] border border-line bg-surface p-4 shadow-xs">
            <span className="text-xs text-muted">Due Balance</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  currentBalance > 0 ? "text-warn" : "text-good"
                }`}
              >
                {formatINR(currentBalance)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {currentBalance > 0 ? "Outstanding Khata" : "All settled"}
            </p>
            {upiUrl && (
              <a
                href={upiUrl}
                className="mt-3 block w-full rounded-[8px] bg-accent py-2 text-center text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
              >
                Pay via UPI
              </a>
            )}
          </div>

          <div className="rounded-[14px] border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-muted">Returnables at Home</span>
              <div className="mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-ink">
                  {cansHeld}
                </span>
                <span className="ml-1 text-xs text-muted">units</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Bottles or tiffin dabbas currently held
              </p>
            </div>
            <Link
              href={`/c/${token}/bills/${currentPeriod}`}
              className="mt-3 block w-full rounded-[8px] border border-line bg-white py-2 text-center text-xs font-semibold text-ink hover:bg-bg transition-colors"
            >
              View Month Bill →
            </Link>
          </div>
        </div>

        {/* Holiday Pause Button */}
        <div>
          <PauseDatesSheet token={token} defaultStart={today} />
        </div>

        {/* 7-Day Actions (Deliver, Skip, Extra) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Upcoming Deliveries</h2>
          </div>

          {subs.length === 0 ? (
            <div className="rounded-[12px] border border-line bg-surface p-6 text-center text-sm text-muted">
              No active subscription found. Contact your vendor to configure your schedule.
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
                  initialChanges={changes.map((c) => ({
                    subscriptionId: c.subscriptionId,
                    serviceDate: c.serviceDate,
                    kind: c.kind,
                    qty: c.qty,
                    isLate: c.isLate,
                  }))}
                />
              </div>
            ))
          )}
        </section>

        {/* Bottom Switch Note */}
        <div className="border-t border-line pt-4 text-center">
          <Link
            href="/app"
            className="text-xs text-muted hover:text-ink hover:underline"
          >
            ← Return to Consumer Home / Explore Local Stores
          </Link>
        </div>
      </div>
    );
  }

  // If no token or invalid token, render Consumer Hub with Connector + Pan-India Hyperlocal Discovery
  const activeVendors = await getActiveVendorsWithProducts();

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 pb-20">
      {/* Hero Welcome & Token Connector */}
      <div className="rounded-[20px] border border-line bg-linear-to-b from-surface to-bg p-6 sm:p-8 text-center sm:text-left">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          RUXS Consumer Portal
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Your Household Essentials Hub
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Manage daily homestyle tiffins and 20L drinking water deliveries right from your browser. 1-tap skips, returnable bottle tracking, and seamless UPI khata payments.
        </p>

        {/* Token Input Form */}
        <div className="mt-6 rounded-[14px] border border-line bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Connect Your Active Household</h2>
              <p className="text-xs text-muted">
                Enter the private code from your WhatsApp link (e.g. <span className="font-mono text-ink">demo-household</span>)
              </p>
            </div>
            <Link
              href="/app?token=demo-household"
              className="mt-2 inline-flex items-center text-xs font-semibold text-accent hover:underline sm:mt-0"
            >
              <span>⚡ Try Sample Household</span>
              <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>

          <ConsumerTokenForm defaultToken={token} />

          {token && !customerAuth && (
            <p className="mt-3 rounded-[8px] bg-bad/10 p-2.5 text-xs font-medium text-bad">
              Could not find an active household subscription for &ldquo;{token}&rdquo;. Please verify your token with your supplier or try the sample household above.
            </p>
          )}
        </div>
      </div>

      {/* Pan-India Zomato-Style Location Discovery */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Hyperlocal Discovery Across India
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Stores & Suppliers Near You
          </h2>
          <p className="mt-1 text-sm text-muted">
            Bounded by geofencing. Detect your location to discover independent kitchens and purified water suppliers delivering to your flat.
          </p>
        </div>

        <NearbyStores initialVendors={activeVendors} />
      </section>

      {/* Footer Merchant Callout */}
      <div className="rounded-[14px] border border-dashed border-line bg-surface/50 p-4 text-center text-xs text-muted">
        <span>Are you a tiffin service or water supplier? </span>
        <Link
          href="/merchant"
          className="font-semibold text-accent hover:underline"
        >
          Open the Merchant Workspace →
        </Link>
      </div>
    </div>
  );
}
