import { requireVendorModule } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import { getVendorAnalytics } from "@/features/analytics/queries";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  // Booking providers have sessions, not deliveries.
  await requireVendorModule(slug, "analytics");
  const data = await getVendorAnalytics(slug);

  const count = (status: string) =>
    Number(data.byStatus.find((row) => row.status === status)?.orderCount ?? 0);
  const units = (status: string) =>
    Number(data.byStatus.find((row) => row.status === status)?.units ?? 0);
  const deliveredValue = data.byStatus.reduce(
    (sum, row) => sum + Number(row.deliveredValuePaise),
    0
  );
  const totalOrders = data.byStatus.reduce(
    (sum, row) => sum + Number(row.orderCount),
    0
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Business intelligence</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Order activity from {data.fromDate} through {data.toDate}. Revenue is calculated from delivered order price snapshots, not payment settlement.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <p className="text-xs text-muted">Orders created</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{totalOrders.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-muted">All statuses, 30 days</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <p className="text-xs text-muted">Delivered orders</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-good">{count("delivered").toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-muted">{units("delivered").toLocaleString("en-IN")} units delivered</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <p className="text-xs text-muted">Still confirmed</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{count("confirmed").toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-muted">Orders not yet closed</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <p className="text-xs text-muted">Delivered value</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{formatINR(deliveredValue)}</p>
          <p className="mt-1 text-xs text-muted">Based on order-time prices</p>
        </div>
      </section>

      <section className="rounded-[12px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-ink">Status breakdown</h2>
        {data.byStatus.length === 0 ? (
          <p className="mt-3 text-sm text-muted">There are no orders in this 30-day window yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {data.byStatus.map((row) => (
              <div key={row.status} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm capitalize text-ink">{row.status.replaceAll("_", " ")}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-ink">{Number(row.orderCount).toLocaleString("en-IN")} orders</p>
                  <p className="text-xs text-muted">{Number(row.units).toLocaleString("en-IN")} units</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[12px] border border-line bg-surface p-4 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Product performance</h2>
          <p className="mt-1 text-sm text-muted">Past orders keep their recorded unit price when you later change a product&apos;s price.</p>
        </div>
        {data.byProduct.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Product statistics will appear after orders are created.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 font-medium">Shift</th>
                  <th className="py-3 pr-4 text-right font-medium">Orders</th>
                  <th className="py-3 pr-4 text-right font-medium">Units delivered</th>
                  <th className="py-3 text-right font-medium">Delivered value</th>
                </tr>
              </thead>
              <tbody>
                {data.byProduct.map((product) => (
                  <tr key={product.productId} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{product.productName}</p>
                      <p className="text-xs capitalize text-muted">{product.kind}</p>
                    </td>
                    <td className="py-3 pr-4 capitalize text-muted">{product.shift}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ink">{Number(product.orderCount).toLocaleString("en-IN")}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ink">{Number(product.deliveredUnits).toLocaleString("en-IN")}</td>
                    <td className="py-3 text-right tabular-nums text-ink">{formatINR(Number(product.deliveredValuePaise))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
