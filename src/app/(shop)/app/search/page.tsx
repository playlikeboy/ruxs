import { getMyLocation, listStores } from "@/features/consumer/queries";
import { CategoryBar } from "@/features/consumer/components/category-bar";
import { getCategories } from "@/features/platform/queries";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreCard } from "@/features/consumer/components/store-card";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 60);
  const [location, categories] = await Promise.all([getMyLocation(), getCategories()]);
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
            <h1 className="text-lg font-semibold text-ink">
              {stores.length} {stores.length === 1 ? "result" : "results"} for “{query}”
            </h1>
            {stores.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">Try “thali”, “20L”, “Jain” or a store name.</p>
            ) : (
              <div className="mt-5 space-y-7">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
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
