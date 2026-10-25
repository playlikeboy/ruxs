import { getMyLocation, getSearchRadius, listStores } from "@/features/consumer/queries";
import { SearchRadiusPicker } from "@/features/consumer/components/search-radius-picker";
import { CategoryBar } from "@/features/consumer/components/category-bar";
import { getCategories } from "@/features/platform/queries";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreFilterList } from "@/features/consumer/components/store-filter-list";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 60);
  const [location, categories, searchRadius] = await Promise.all([getMyLocation(), getCategories(), getSearchRadius()]);
  const stores = query
    ? await listStores({ q: query, latitude: location.latitude, longitude: location.longitude })
    : [];

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-20 space-y-3 bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <SearchBar defaultValue={query} />
        <CategoryBar categories={categories} />
      </div>
      <div className="px-4 pt-5">
        {query ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 text-lg font-semibold text-ink">
                {stores.length} {stores.length === 1 ? "result" : "results"} for “{query}”
              </h1>
              <SearchRadiusPicker km={searchRadius.km} />
            </div>
            {stores.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">Try “thali”, “20L”, “Jain”, a store name, or a wider radius.</p>
            ) : (
              <div className="mt-5">
                <StoreFilterList stores={stores} />
              </div>
            )}
          </>
        ) : (
          <p className="pt-6 text-center text-sm text-neutral-500">Search stores, meals and water cans near you.</p>
        )}
      </div>
    </div>
  );
}
