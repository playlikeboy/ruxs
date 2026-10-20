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

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  tiffin: { label: "Tiffin Services", icon: UtensilsCrossed },
  water: { label: "Water Delivery", icon: Droplet },
  milk: { label: "Dairy & Milk", icon: Milk },
  fitness: { label: "Gym Trainers", icon: Dumbbell },
  physio: { label: "Physiotherapy", icon: Stethoscope },
  mehndi: { label: "Mehndi Artists", icon: Sparkles },
  kids: { label: "Kids Activities", icon: Sparkles },
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

  return (
    <div className="space-y-6">
      {/* Platform GMV & Revenue Card */}
      <div className="rounded-[18px] bg-ink p-6 text-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted/80">
              Total 30-Day Platform Gross Volume
            </span>
            <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums sm:text-4xl text-white">
              {formatINR(totalGMV)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButton
              filename="ruxs-platform-report"
              title="Export Report"
              getData={getExportData}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div>
            <p className="text-white/60 uppercase tracking-wide text-[10px]">App Direct Orders</p>
            <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
              {formatINR(data.shopValuePaise)}
            </p>
            <p className="text-white/60 text-[11px]">Instant pay / COD checkout</p>
          </div>

          <div>
            <p className="text-white/60 uppercase tracking-wide text-[10px]">Monthly Subscriptions</p>
            <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
              {formatINR(data.planValuePaise)}
            </p>
            <p className="text-white/60 text-[11px]">Daily tiffin, water &amp; milk</p>
          </div>

          <div>
            <p className="text-white/60 uppercase tracking-wide text-[10px]">Bookings &amp; Sessions</p>
            <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
              {formatINR(data.bookingStats.valuePaise)}
            </p>
            <p className="text-white/60 text-[11px]">{data.bookingStats.count} trainer &amp; beauty sessions</p>
          </div>
        </div>
      </div>

      {/* Categories Distribution */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="text-base font-bold text-ink">Active Stores by Category</h2>
          </div>
          <Link href="/admin/vendors" className="text-xs font-semibold text-accent hover:underline">
            Manage stores →
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
                  <span className="text-xs font-medium truncate">{meta.label}</span>
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
