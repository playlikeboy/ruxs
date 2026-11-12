"use client";

import Link from "next/link";
import { formatINR } from "@/core/money";
import { ExportButton, type ExportData } from "./export-button";
import {
  UtensilsCrossed,
  Droplet,
  Milk,
  Dumbbell,
  Stethoscope,
  Sparkles,
  Gift,
  HelpCircle,
  TrendingUp,
  Receipt,
  Layers,
} from "lucide-react";

interface AdminOverviewData {
  vendors: { active: number; pending: number; suspended: number };
  categoryBreakdown: { categoryId: string; count: number }[];
  households: number;
  customers: number;
  activeSubs: number;
  openOrders: number;
  ordersToday: number;
  shopValuePaise: number;
  planValuePaise: number;
  bookingStats: { count: number; valuePaise: number };
  invoiceStats: { count: number; chargesPaise: number; paidPaise: number };
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  tiffin: { label: "Tiffin Services", icon: UtensilsCrossed },
  water: { label: "Water Delivery", icon: Droplet },
  milk: { label: "Dairy & Milk", icon: Milk },
  fitness: { label: "Gym Trainers", icon: Dumbbell },
  physio: { label: "Physiotherapy", icon: Stethoscope },
  mehndi: { label: "Mehndi Artists", icon: Sparkles },
  kids: { label: "Kids Zone", icon: Sparkles },
  gifts: { label: "Custom Gifts", icon: Gift },
  other: { label: "Other Essentials", icon: HelpCircle },
};

export function AdminOverviewClient({ data }: { data: AdminOverviewData }) {
  const getExportData = (): ExportData => {
    return {
      headers: ["Metric", "Value", "Notes"],
      rows: [
        ["Active Stores", data.vendors.active, `${data.vendors.pending} pending, ${data.vendors.suspended} suspended`],
        ["Households", data.households, `${data.customers} customer connections`],
        ["Active Daily Plans", data.activeSubs, "Recurring daily subscriptions"],
        ["Open Orders", data.openOrders, `${data.ordersToday} scheduled for today`],
        ["30-Day Delivered Orders GMV (Rs)", (data.shopValuePaise / 100).toFixed(2), "App direct checkout"],
        ["30-Day Subscriptions Billed (Rs)", (data.planValuePaise / 100).toFixed(2), "Monthly billed plans"],
        ["30-Day Session Bookings GMV (Rs)", (data.bookingStats.valuePaise / 100).toFixed(2), `${data.bookingStats.count} total bookings`],
        ["All-Time Invoiced (Rs)", (data.invoiceStats.chargesPaise / 100).toFixed(2), `${data.invoiceStats.count} invoices`],
        ["All-Time Collected (Rs)", (data.invoiceStats.paidPaise / 100).toFixed(2), "Total payments received"],
        ...data.categoryBreakdown.map((c) => [
          `Category: ${CATEGORY_META[c.categoryId]?.label ?? c.categoryId}`,
          c.count,
          "Active stores",
        ]),
      ],
    };
  };

  const totalGMV = data.shopValuePaise + data.planValuePaise + data.bookingStats.valuePaise;
  const collectionRate =
    data.invoiceStats.chargesPaise > 0
      ? Math.min(100, Math.round((data.invoiceStats.paidPaise / data.invoiceStats.chargesPaise) * 100))
      : 100;

  return (
    <div className="space-y-6">
      {/* Platform Executive GMV Card */}
      <section aria-labelledby="gmv-title" className="rounded-[16px] bg-ink p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white/70" />
              <h2 id="gmv-title" className="text-xs font-semibold uppercase tracking-wider text-white/80">
                30-day gross merchandise volume
              </h2>
            </div>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
              {formatINR(totalGMV)}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Delivered shop orders, billed plan deliveries and booked sessions across all categories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButton
              filename="ruxs-platform-report"
              title="Export Report"
              getData={getExportData}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white"
            />
          </div>
        </div>

        {/* GMV Channels Breakdown */}
        <dl className="mt-5 grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="py-3 sm:py-0 sm:pr-4">
            <dt className="text-xs font-semibold text-white/70">Marketplace orders</dt>
            <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-white">{formatINR(data.shopValuePaise)}</dd>
            <dd className="mt-0.5 text-xs text-white/70">One-time orders, paid online or on delivery</dd>
          </div>

          <div className="py-3 sm:px-4 sm:py-0">
            <dt className="text-xs font-semibold text-white/70">Daily plans</dt>
            <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-white">{formatINR(data.planValuePaise)}</dd>
            <dd className="mt-0.5 text-xs text-white/70">Deliveries billed to monthly plans</dd>
          </div>

          <div className="py-3 sm:py-0 sm:pl-4">
            <dt className="text-xs font-semibold text-white/70">Session bookings</dt>
            <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-white">{formatINR(data.bookingStats.valuePaise)}</dd>
            <dd className="mt-0.5 text-xs text-white/70">{data.bookingStats.count} bookings</dd>
          </div>
        </dl>

        {/* Invoice Health Mini Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-white/70" />
            <span>
              All-time collections: <strong className="font-mono text-white">{formatINR(data.invoiceStats.paidPaise)}</strong> of{" "}
              <span className="font-mono">{formatINR(data.invoiceStats.chargesPaise)}</span> invoiced
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="progressbar"
              aria-label="Invoices collected"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={collectionRate}
              className="h-2 w-24 overflow-hidden rounded-full bg-white/20"
            >
              <div className="h-full rounded-full bg-brand-coral" style={{ width: `${collectionRate}%` }} />
            </div>
            <span className="font-mono text-[11px] font-bold text-white">{collectionRate}% collected</span>
          </div>
        </div>
      </section>

      {/* Category Ecosystem Section */}
      <section aria-labelledby="category-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 id="category-title" className="text-sm font-semibold uppercase tracking-wider text-ink">
              Active stores by category
            </h2>
          </div>
          <Link
            href="/admin/vendors"
            className="flex items-center gap-1 rounded-[4px] text-xs font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>View all stores</span> <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.categoryBreakdown.map((cat) => {
            const meta = CATEGORY_META[cat.categoryId] ?? {
              label: cat.categoryId,
              icon: HelpCircle,
            };
            const Icon = meta.icon;
            return (
              <Link
                key={cat.categoryId}
                href={`/admin/vendors?categoryId=${encodeURIComponent(cat.categoryId)}`}
                className="group rounded-[16px] border border-line bg-surface p-3.5 transition hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="flex items-center justify-between text-muted group-hover:text-ink">
                  <span className="text-xs font-semibold truncate">{meta.label}</span>
                  <Icon className="h-4 w-4 shrink-0 text-muted group-hover:text-accent transition-colors" />
                </div>
                <p className="mt-2 font-mono text-xl font-bold tabular-nums text-ink">
                  {cat.count}
                </p>
                <p className="text-xs text-muted">active stores</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
