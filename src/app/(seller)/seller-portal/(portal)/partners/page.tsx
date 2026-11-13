import { requireSeller } from "@/features/store/seller-auth";
import { getAdminFulfilmentPartners } from "@/features/store/admin-queries";
import { PartnerManager } from "@/features/store/seller-components/partner-manager";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Partners" };

export default async function SellerPartnersPage() {
  await requireSeller();
  const partners = await getAdminFulfilmentPartners();
  return (
    <div className={PAGE}>
      <PageHeader
        title="Fulfilment partners"
        description="Companies that pack and ship orders RUXs forwards to them. Internal only: households see Shipped by RUXs and a tracking number, never a partner name."
      />
      <PartnerManager partners={partners} />
    </div>
  );
}
