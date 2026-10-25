import { getAllBanners } from "@/features/banners/queries";
import { BannerManager } from "@/features/banners/components/banner-manager";

export const metadata = { title: "Home slides" };

export default async function AdminBannersPage() {
  const rows = await getAllBanners();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home slides</h1>
        <p className="mt-1 text-sm text-muted">Offers, announcements and features at the top of the household app. Changes show right away.</p>
      </div>
      <BannerManager rows={rows} />
    </div>
  );
}
