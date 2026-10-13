import { getVendorAnalytics } from "@/features/vendors/queries";
import { formatINR } from "@/core/money";

export default async function VendorAnalyticsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const data = await getVendorAnalytics(slug);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Business Analytics
        </h1>
        <p className="text-xs text-muted">
          Monthly delivery performance, revenue, and customer retention metrics.
        </p>
      </div>

      {/* Financial Health Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Financial Summary (This Month)
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Billed</span>
            <span className="text-base font-bold text-ink font-mono tabular-nums block mt-0.5">
              {formatINR(data.billedPaiseThisMonth)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5">Deliveries & fees</span>
          </div>

          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Collected</span>
            <span className="text-base font-bold text-good font-mono tabular-nums block mt-0.5">
              {formatINR(data.collectedPaiseThisMonth)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5">Payments received</span>
          </div>

          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Outstanding</span>
            <span
              className={`text-base font-bold font-mono tabular-nums block mt-0.5 ${
                data.outstandingBalancePaise > 0 ? "text-[#9A5B00]" : "text-ink"
              }`}
            >
              {formatINR(data.outstandingBalancePaise)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5">Khata balance</span>
          </div>
        </div>
      </div>

      {/* Operations & Delivery Volume */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Operations & Fulfillment
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Total Delivered</span>
            <span className="text-xl font-bold text-ink font-mono tabular-nums block mt-0.5">
              {data.deliveredOrders}
            </span>
            <span className="text-[10px] text-muted block mt-0.5">
              {data.deliveredUnits} units
            </span>
          </div>

          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Fulfillment Rate</span>
            <span className="text-xl font-bold text-good font-mono tabular-nums block mt-0.5">
              {data.completionRate}%
            </span>
            <span className="text-[10px] text-muted block mt-0.5">
              Completion score
            </span>
          </div>

          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Skips Tapped</span>
            <span className="text-xl font-bold text-accent font-mono tabular-nums block mt-0.5">
              {data.skippedOrders}
            </span>
            <span className="text-[10px] text-muted block mt-0.5">
              Via customer link
            </span>
          </div>

          <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
            <span className="text-[11px] text-muted block">Failed Stops</span>
            <span className="text-xl font-bold text-[#B42318] font-mono tabular-nums block mt-0.5">
              {data.failedOrders}
            </span>
            <span className="text-[10px] text-muted block mt-0.5">
              Door locked / refused
            </span>
          </div>
        </div>
      </div>

      {/* Customers & Subscriptions */}
      <div className="bg-surface border border-line rounded-[14px] p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-ink">
          Customer Roster & Subscription Base
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[#FAFAF7] border border-line rounded-[10px]">
            <span className="text-xs text-muted block">Total Customers</span>
            <span className="text-2xl font-bold text-ink font-mono mt-1 block">
              {data.totalCustomers}
            </span>
            <span className="text-[11px] text-muted block mt-0.5">
              Onboarded households
            </span>
          </div>

          <div className="p-3 bg-[#FAFAF7] border border-line rounded-[10px]">
            <span className="text-xs text-muted block">Active Subscriptions</span>
            <span className="text-2xl font-bold text-accent font-mono mt-1 block">
              {data.activeSubscriptions}
            </span>
            <span className="text-[11px] text-muted block mt-0.5">
              Recurring daily slots
            </span>
          </div>
        </div>

        {/* Product Catalog */}
        <div className="pt-2 border-t border-line/60">
          <h4 className="text-xs font-semibold text-ink mb-2">Active Catalog</h4>
          <div className="space-y-1.5">
            {data.products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs py-1.5 px-2 bg-bg rounded-[6px] border border-line/40"
              >
                <div>
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="text-muted text-[10px] ml-2 capitalize">
                    {p.shift} shift • Cutoff {p.cutoffAt}
                  </span>
                </div>
                <span className="font-mono font-bold text-ink">
                  {formatINR(p.pricePaise)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
