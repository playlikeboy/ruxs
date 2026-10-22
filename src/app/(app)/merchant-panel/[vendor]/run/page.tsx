import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { todayIST } from "@/core/time";
import { getRunSheetOrders } from "@/features/orders/queries";
import { RunSheetList } from "@/features/orders/components/run-sheet-list";
import { EmptyState } from "@/components/ui/empty-state";

export default async function RunPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  // Booking providers have sessions, not deliveries.
  await requireVendorModule(slug, "run");
  const today = todayIST();
  const stops = await getRunSheetOrders(slug, today);

  return (
    <div className="max-w-3xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Run Sheet
          </h1>
          <p className="text-xs text-muted">
            Optimized delivery route: society → tower → floor (descending) → flat
          </p>
        </div>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          title="No deliveries today"
          description="Either all households skipped or today's orders have not locked at cutoff time yet."
          action={
            <Link
              href={`/merchant-panel/${slug}/today`}
              className="inline-block px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]"
            >
              View Kitchen Counts
            </Link>
          }
        />
      ) : (
        <RunSheetList stops={stops} slug={slug} />
      )}
    </div>
  );
}
