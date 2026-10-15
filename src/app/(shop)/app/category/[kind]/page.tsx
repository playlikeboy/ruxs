import { notFound } from "next/navigation";
import { getMyLocation, listStores } from "@/features/consumer/queries";
import { SERVICE_KINDS, type ServiceKind } from "@/config/service-kinds";
import { CategoryBar } from "@/features/consumer/components/category-bar";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreCard } from "@/features/consumer/components/store-card";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";

export default async function CategoryPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const config = SERVICE_KINDS.find((k) => k.id === kind);
  if (!config) notFound();

  const location = await getMyLocation();
  const stores = await listStores({
    kind: kind as ServiceKind,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-20 space-y-3 bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <SearchBar />
        <CategoryBar active={kind} />
      </div>
      <div className="px-4 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{config.label}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {stores.filter((s) => s.inRange).length} stores deliver to you · {config.blurb.toLowerCase()}
        </p>
        {stores.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-neutral-50 p-8 text-center">
            <p className="text-4xl" aria-hidden="true">{config.emoji}</p>
            <p className="mt-3 font-semibold text-ink">No {config.short.toLowerCase()} stores yet</p>
            <p className="mt-1 text-sm text-neutral-500">We&apos;re onboarding local vendors in your area.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-7">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
      <ViewCartBar />
    </div>
  );
}
