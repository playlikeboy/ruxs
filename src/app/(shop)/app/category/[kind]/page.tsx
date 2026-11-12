import { ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyLocation, getSearchRadius, listStores } from "@/features/consumer/queries";
import { getCategories } from "@/features/platform/queries";
import { SearchRadiusPicker } from "@/features/consumer/components/search-radius-picker";
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
  const [categories, searchRadius, location] = await Promise.all([getCategories(), getSearchRadius(), getMyLocation()]);
  const config = categories.find((k) => k.id === kind);
  if (!config) notFound();

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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{config.label}</h1>
            <p className="mt-1 text-sm text-muted tabular-nums">
              {stores.length} {stores.length === 1 ? "store" : "stores"} within {searchRadius.km} km · {config.blurb.toLowerCase()}
            </p>
          </div>
          <SearchRadiusPicker km={searchRadius.km} className="mt-1" />
        </div>

        {(kind === "kids" || kind === "kids-kits") && (
          <Link
            href="/app/kids"
            className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-[16px] border border-line bg-brand-butter p-3.5 transition-colors hover:border-ink/25"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">Open Kids Zone</span>
              <span className="block text-xs text-muted">Classes, workshops and learning kits in one place</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </Link>
        )}
        {stores.length === 0 ? (
          <div className="mt-8 rounded-[16px] bg-app-canvas p-8 text-center">
            <AppIcon name={kind} className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-3 font-semibold text-ink">No {config.shortLabel.toLowerCase()} stores within {searchRadius.km} km yet</p>
            <p className="mt-1 text-sm text-muted">Try a wider radius, or check your location.</p>
          </div>
        ) : (
          <div className="mt-5">
            <StoreFilterList stores={stores} />
          </div>
        )}
      </div>
      <ViewCartBar />
    </div>
  );
}
