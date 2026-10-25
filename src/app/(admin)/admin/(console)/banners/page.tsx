import { getAllBanners } from "@/features/banners/queries";
import { BannerManager } from "@/features/banners/components/banner-manager";

export const metadata = { title: "Home slides" };

export default async function AdminBannersPage() {
  const { ready, rows } = await getAllBanners();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home slides</h1>
        <p className="mt-1 text-sm text-muted">Offers, announcements and features at the top of the household app. Changes show right away.</p>
      </div>
      {ready ? (
        <BannerManager rows={rows} />
      ) : (
        <p role="status" className="rounded-[12px] bg-butter px-4 py-3 text-sm text-warn">
          Slides need one database update first. Run <code className="font-mono">bun --env-file=.env.local scripts/apply-sql-migrations.ts 0023_home_banners</code>, then reload.
        </p>
      )}
    </div>
  );
}
