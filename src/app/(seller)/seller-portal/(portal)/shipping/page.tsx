import Link from "next/link";
import { formatINR } from "@/core/money";
import { etaLabel } from "@/core/store";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminShippingZones } from "@/features/store/admin-queries";
import { PAGE, PageHeader, Panel, panelLink } from "@/features/store/seller-components/seller-ui";
import { ZoneManager } from "@/features/store/seller-components/zone-manager";

export const metadata = { title: "Shipping zones" };

export default async function SellerShippingPage() {
  await requireSeller();
  const { zones, defaults } = await getAdminShippingZones();

  return (
    <div className={PAGE}>
      <PageHeader
        title="Shipping zones"
        description="Set the delivery fee, delivery time and COD for a group of PIN codes or states. The longest matching PIN prefix wins, then a state. Zone names stay inside the team."
      />
      <ZoneManager zones={zones} />
      <Panel id="defaults-h" title="Everywhere else" note="PIN codes that no zone covers." action={<Link href="/seller-portal/settings" className={panelLink}>Change in Settings</Link>}>
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 sm:divide-x">
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-muted">Delivery fee</dt>
            <dd className="text-sm font-semibold tabular-nums text-ink">{defaults.feePaise === 0 ? "Free" : formatINR(defaults.feePaise)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-muted">Free above</dt>
            <dd className="text-sm font-semibold tabular-nums text-ink">{defaults.freeAbovePaise == null ? "Never" : formatINR(defaults.freeAbovePaise)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-muted">Delivery time</dt>
            <dd className="text-sm font-semibold tabular-nums text-ink">{etaLabel(defaults.etaMinDays, defaults.etaMaxDays)}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
