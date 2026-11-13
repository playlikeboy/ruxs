import { requireSeller } from "@/features/store/seller-auth";
import { getStoreSettings } from "@/features/store/queries";
import { StoreSettingsForm } from "@/features/store/seller-components/settings-form";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";
import { istDateTime } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Settings" };

export default async function SellerSettingsPage() {
  await requireSeller();
  const settings = await getStoreSettings();
  return (
    <div className={PAGE}>
      <PageHeader
        title="Store settings"
        description={`Changes apply to new orders right away.${settings.updatedAt ? ` Last saved ${istDateTime(settings.updatedAt)}.` : ""}`}
      />
      <StoreSettingsForm key={settings.updatedAt?.toISOString() ?? "new"} settings={settings} />
    </div>
  );
}
