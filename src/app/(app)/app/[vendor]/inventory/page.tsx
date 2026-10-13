import { getVendorInventoryData } from "@/features/assets/queries";
import { InventoryManager } from "@/features/assets/components/inventory-manager";

export default async function VendorInventoryPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const data = await getVendorInventoryData(slug);

  const activeHolders = data.customerHoldings.filter(
    (c) => c.cansHeld > 0 || c.dabbasHeld > 0
  ).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Asset & Bottle Inventory
        </h1>
        <p className="text-xs text-muted">
          Real-time tracking of 20L water cans and tiffin dabbas held by customers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
          <span className="text-[11px] text-muted block">20L Cans Out</span>
          <span className="text-xl font-bold text-accent font-mono tabular-nums">
            {data.cansTotal}
          </span>
          <span className="text-[10px] text-muted block mt-0.5">With households</span>
        </div>

        <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
          <span className="text-[11px] text-muted block">Dabbas Out</span>
          <span className="text-xl font-bold text-ink font-mono tabular-nums">
            {data.dabbasTotal}
          </span>
          <span className="text-[10px] text-muted block mt-0.5">With households</span>
        </div>

        <div className="p-3 bg-surface border border-line rounded-[12px] shadow-xs">
          <span className="text-[11px] text-muted block">Active Holders</span>
          <span className="text-xl font-bold text-good font-mono tabular-nums">
            {activeHolders}
          </span>
          <span className="text-[10px] text-muted block mt-0.5">Households</span>
        </div>
      </div>

      {/* Manager UI */}
      <InventoryManager
        slug={slug}
        customerHoldings={data.customerHoldings}
        recentMovements={data.recentMovements}
      />
    </div>
  );
}
