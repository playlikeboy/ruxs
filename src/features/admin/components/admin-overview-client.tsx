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
      <div className="relative overflow-hidden rounded-[20px] bg-ink p-6 text-white shadow-md">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/10 text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-accent" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                30-Day Gross Merchandise Volume
              </span>
            </div>
            <p className="mt-2 font-mono text-3xl font-black tabular-nums tracking-tight sm:text-4xl text-white">
              {formatINR(totalGMV)}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Combined direct shop orders, subscription runs &amp; booking sessions across all categories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButton
              filename="ruxs-platform-report"
              title="Export Report"
              getData={getExportData}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition text-xs"
            />
          </div>
        </div>

        {/* GMV Channels Breakdown */}
        <div className="relative z-10 mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="rounded-[14px] bg-white/5 p-3.5 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Marketplace Orders
            </p>
            <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
              {formatINR(data.shopValuePaise)}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">One-time / instant pay &amp; COD</p>
          </div>

          <div className="rounded-[14px] bg-white/5 p-3.5 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Daily Subscriptions
            </p>
            <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
              {formatINR(data.planValuePaise)}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">Billed monthly recurring plans</p>
          </div>

          <div className="rounded-[14px] bg-white/5 p-3.5 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Session Bookings
            </p>
            <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
              {formatINR(data.bookingStats.valuePaise)}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">{data.bookingStats.count} total client bookings</p>
          </div>
        </div>

        {/* Invoice Health Mini Bar */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-accent" />
            <span>
              All-Time Collections: <strong className="font-mono text-white">{formatINR(data.invoiceStats.paidPaise)}</strong> of{" "}
              <span className="font-mono">{formatINR(data.invoiceStats.chargesPaise)}</span> invoiced
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-white">{collectionRate}% collected</span>
          </div>
        </div>
      </div>

      {/* Category Ecosystem Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Category Distribution
            </h2>
          </div>
          <Link
            href="/admin/vendors"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            <span>View all stores</span> →
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
                href={`/admin/vendors?categoryId=${cat.categoryId}`}
                className="group rounded-[14px] border border-line bg-surface p-3.5 transition hover:border-ink/40 hover:shadow-2xs"
              >
                <div className="flex items-center justify-between text-muted group-hover:text-ink">
                  <span className="text-xs font-semibold truncate">{meta.label}</span>
                  <Icon className="h-4 w-4 shrink-0 text-muted group-hover:text-accent transition-colors" />
                </div>
                <p className="mt-2 font-mono text-xl font-bold tabular-nums text-ink">
                  {cat.count}
                </p>
                <p className="text-[10px] text-muted">active stores</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
