import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyLocation, listStores } from "@/features/consumer/queries";
import { getCategories, getPlatformSettings } from "@/features/platform/queries";
import { CategoryBar } from "@/features/consumer/components/category-bar";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreFilterList } from "@/features/consumer/components/store-filter-list";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  const categories = await getCategories();
  const config = categories.find((k) => k.id === kind);
  if (!config) return { title: "Category" };
  return {
    title: `${config.label} Near You`,
    description: `${config.blurb}. Order or book directly from local neighbourhood providers on RUXs.`,
    openGraph: {
      title: `${config.label} · RUXs`,
      description: `${config.blurb}. Local neighbourhood doorstep service.`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const [categories, settings] = await Promise.all([getCategories(), getPlatformSettings()]);
  const config = categories.find((k) => k.id === kind);
  if (!config) notFound();

  const location = await getMyLocation();
  const stores = await listStores({
    kind,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-20 space-y-3 bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <SearchBar />
        <CategoryBar categories={categories} active={kind} />
      </div>
      <div className="px-4 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{config.label}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {stores.length} {stores.length === 1 ? "store" : "stores"} within {settings.discoveryRadiusKm} km · {config.blurb.toLowerCase()}
        </p>

        {(kind === "kids" || kind === "kids-kits") && (
          <Link
            href="/app/kids"
            className="mt-4 flex items-center justify-between rounded-2xl border-2 border-slate-900 bg-amber-300 p-3.5 shadow-[3px_3px_0_0_#0f172a] transition active:translate-y-0.5 active:shadow-none"
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">🚀 Dedicated Experience</span>
              <p className="text-sm font-extrabold text-slate-950">Open Interactive Kids Zone & Classes →</p>
            </div>
            <span className="text-2xl" aria-hidden="true">🎈</span>
          </Link>
        )}
        {stores.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-neutral-50 p-8 text-center">
            <p className="text-4xl" aria-hidden="true">{config.emoji}</p>
            <p className="mt-3 font-semibold text-ink">No {config.shortLabel.toLowerCase()} stores within {settings.discoveryRadiusKm} km yet</p>
            <p className="mt-1 text-sm text-neutral-500">We&apos;re onboarding local vendors in your area.</p>
          </div>
        ) : (
          <div className="mt-5">
            <StoreFilterList stores={stores} radius={settings.discoveryRadiusKm} />
          </div>
        )}
      </div>
      <ViewCartBar />
    </div>
  );
}
