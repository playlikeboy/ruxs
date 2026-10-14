import Link from "next/link";
import { todayIST } from "@/core/time";
import { getVendorProducts } from "@/features/products/queries";
import { getTodayOrders } from "@/features/orders/queries";
import { getDayChangesForVendor } from "@/features/day-changes/queries";
import { BigCount } from "@/features/orders/components/big-count";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TodayPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const today = todayIST();

  const [products, todayData, changes] = await Promise.all([
    getVendorProducts(slug),
    getTodayOrders(slug, today),
    getDayChangesForVendor(slug, today),
  ]);

  const ordersCountMap = new Map(
    todayData.counts.map((c) => [c.product.id, c])
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Date & Subtitle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Today
          </h1>
          <p className="text-xs text-muted">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            })}
          </p>
        </div>

        <Link
          href={`/merchant/${slug}/run`}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs font-medium rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
        >
          <span>Open Run Sheet</span>
          <svg
            className="w-4 h-4 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Quick Access to Inventory & Analytics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link
          href={`/merchant/${slug}/inventory`}
          className="p-2.5 sm:p-3 bg-surface border border-line rounded-[10px] hover:border-accent transition-colors flex items-center justify-between"
        >
          <div>
            <span className="font-semibold text-ink block">📦 Bottle / Dabba Inventory</span>
            <span className="text-[10px] text-muted">Track customer holdings</span>
          </div>
          <span className="text-muted text-xs">→</span>
        </Link>
        <Link
          href={`/merchant/${slug}/analytics`}
          className="p-2.5 sm:p-3 bg-surface border border-line rounded-[10px] hover:border-accent transition-colors flex items-center justify-between"
        >
          <div>
            <span className="font-semibold text-ink block">📊 Business Analytics</span>
            <span className="text-[10px] text-muted">Revenue & fulfillment score</span>
          </div>
          <span className="text-muted text-xs">→</span>
        </Link>
      </div>

      {/* Big Count Cards per Product */}
      <div className="space-y-4">
        {products.length === 0 ? (
          <EmptyState
            title="No products configured"
            description="Add your first tiffin meal or water can product to start taking orders."
            action={
              <Link
                href={`/merchant/${slug}/products`}
                className="inline-block px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]"
              >
                Add Product
              </Link>
            }
          />
        ) : (
          products.map((p) => {
            const stats = ordersCountMap.get(p.id);
            const confirmedQty = stats?.confirmedQty ?? 0;
            const deliveredCount =
              todayData.orders.filter(
                (o) => o.product.id === p.id && o.order.status === "delivered"
              ).length ?? 0;
            const skippedCount = stats?.skippedCount ?? 0;

            return (
              <BigCount
                key={p.id}
                product={p}
                confirmedQty={confirmedQty}
                deliveredCount={deliveredCount}
                skippedCount={skippedCount}
              />
            );
          })
        )}
      </div>

      {/* Changes list since yesterday */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            Today&apos;s Changes
          </h2>
          <span className="text-xs text-muted font-mono tabular-nums">
            {changes.length} {changes.length === 1 ? "tap" : "taps"}
          </span>
        </div>

        {changes.length === 0 ? (
          <div className="p-4 bg-surface border border-line rounded-[12px] text-center text-xs text-muted">
            No skips or extras tapped for today yet. Default subscriptions run.
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-[12px] divide-y divide-line overflow-hidden">
            {changes.map(({ change, customer, product }) => (
              <div
                key={change.id}
                className="p-3.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-ink flex items-center gap-1.5">
                    <span>{customer.name}</span>
                    <span className="text-[10px] text-muted">
                      ({customer.flat}, {customer.tower})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {product.name} • via {change.source}
                    {change.isLate && (
                      <span className="ml-1 text-[#B42318] font-medium">
                        (Late tap)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      change.kind === "skip"
                        ? "bg-[#FAFAF7] text-muted border border-line"
                        : change.kind === "extra"
                          ? "bg-[#E1F3E7] text-good"
                          : "bg-[#FFF3C9] text-ink"
                    }`}
                  >
                    {change.kind === "skip"
                      ? "Skipped"
                      : change.kind === "extra"
                        ? `Extra (+${change.qty})`
                        : `Qty (${change.qty})`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
