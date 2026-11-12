import { requireVendorModule } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { todayIST } from "@/core/time";
import { getRunSheetOrders } from "@/features/orders/queries";
import { RunSheetList } from "@/features/orders/components/run-sheet-list";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Run sheet" };

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
    <div className="max-w-3xl space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Run sheet"
        description="Stops in walking order: society, tower, floor (top down), then flat."
      />

      {stops.length === 0 ? (
        <EmptyState
          title="No deliveries today"
          description="Either all households skipped or today's orders have not locked at cutoff time yet."
          action={<ButtonLink href={`/merchant-panel/${slug}/today`}>View today&apos;s counts</ButtonLink>}
        />
      ) : (
        <RunSheetList stops={stops} slug={slug} />
      )}
    </div>
  );
}
