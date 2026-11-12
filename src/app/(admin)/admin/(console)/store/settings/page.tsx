import Link from "next/link";
import { getStoreSettings } from "@/features/store/queries";
import { StoreSettingsForm } from "@/features/store/admin-components/settings-form";
import { istDateTime } from "@/features/store/admin-components/store-labels";

export const metadata = { title: "Store settings" };

export default async function AdminStoreSettingsPage() {
  const settings = await getStoreSettings();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-muted">
          <Link href="/admin/store" className="hover:text-ink hover:underline">RUXs Store</Link>
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Store settings</h1>
        <p className="mt-1 text-sm text-muted">
          Changes apply to new orders right away.
          {settings.updatedAt ? ` Last saved ${istDateTime(settings.updatedAt)}.` : ""}
        </p>
      </div>
      <StoreSettingsForm settings={settings} />
    </div>
  );
}
