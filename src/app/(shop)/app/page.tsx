import Link from "next/link";
import { getMyLocation, getMyPlans, getMyProfile, listStores } from "@/features/consumer/queries";
import { getCategoryMap } from "@/features/platform/queries";
import { TodayCard, type TodayItem } from "@/features/consumer/components/today-card";
import { isLate } from "@/core/cutoff";
import { weekdayIST } from "@/core/time";
import { getCategories, getPlatformSettings } from "@/features/platform/queries";
import { LocationChip } from "@/features/consumer/components/location-chip";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreCard } from "@/features/consumer/components/store-card";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";

export const metadata = { title: "Explore" };

export default async function ExplorePage() {
  const { user, profile } = await getMyProfile();
  const [location, categories, settings] = await Promise.all([getMyLocation(), getCategories(), getPlatformSettings()]);
  // listStores already applies the geofence: only stores within the discovery radius come back.
  const stores = await listStores({ latitude: location.latitude, longitude: location.longitude });
  const radius = settings.discoveryRadiusKm;

  // Plans that deliver today, for the "receive today?" card.
  const [{ today, plans }, category] = await Promise.all([getMyPlans(), getCategoryMap()]);
  const weekday = weekdayIST(today);
  const now = new Date();
  const todayItems: TodayItem[] = plans
    .filter((p) => p.sub.days.includes(weekday) && p.sub.startsOn <= today && (!p.sub.endsOn || p.sub.endsOn >= today))
    .map((p) => {
      const change = p.changes.find((c) => c.serviceDate === today);
      return {
        subscriptionId: p.sub.id,
        emoji: category(p.product.kind).emoji,
        productName: p.product.name,
        vendorName: p.vendorName,
        qty: change?.kind === "extra" ? p.sub.qty + change.qty : change?.kind === "qty" ? change.qty : p.sub.qty,
        unit: p.product.assetName ?? "unit",
        cutoffAt: p.product.cutoffAt,
        skipped: change?.kind === "skip",
        locked: isLate(now, today, p.product.cutoffAt),
      };
    });
  const firstName = (profile?.name ?? user.displayName ?? "").split(" ")[0];

  return (
    <div className="pb-24">
      <div className="space-y-4 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <LocationChip label={location.label} source={location.source} />
        <SearchBar />
      </div>

      <div className="px-4">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          {firstName ? `Hi ${firstName},` : "Hi there,"}
          <br />
          <span className="text-neutral-500">what does home need today?</span>
        </h1>

        {todayItems.length > 0 && (
          <div className="mt-5">
            <TodayCard items={todayItems} today={today} />
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {categories.map((k) => (
            <Link
              key={k.id}
              href={`/app/category/${k.id}`}
              className="relative flex h-[104px] flex-col justify-between overflow-hidden rounded-2xl p-3.5 transition active:scale-[0.98]"
              style={{ backgroundColor: k.tint }}
            >
              <span className="text-[15px] font-semibold leading-tight text-ink">{k.label}</span>
              <span className="max-w-[70%] text-[11px] leading-4 text-neutral-600">{k.blurb}</span>
              <span className="absolute -bottom-2 -right-1 text-[52px] leading-none" aria-hidden="true">{k.emoji}</span>
            </Link>
          ))}
        </div>

        {!profile && (
          <Link href="/app/account" className="mt-5 flex items-center justify-between rounded-2xl border border-black/10 p-4">
            <span>
              <span className="block text-[15px] font-semibold text-ink">Add your address</span>
              <span className="block text-sm text-neutral-500">See stores that deliver to your building</span>
            </span>
            <span className="text-sm font-bold text-accent">Add →</span>
          </Link>
        )}

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-ink">Within {radius} km of you</h2>
            {location.source !== "none" && <span className="text-sm text-neutral-500 tabular-nums">{stores.length} stores</span>}
          </div>
          {location.source === "none" ? (
            <div className="mt-4 rounded-2xl bg-neutral-50 p-6 text-center">
              <p className="text-3xl" aria-hidden="true">📍</p>
              <p className="mt-2 font-semibold text-ink">Share your location to see stores</p>
              <p className="mt-1 text-sm text-neutral-500">We only show kitchens and suppliers within {radius} km of you. Tap “Use exact location” above, or add your address.</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-neutral-50 p-6 text-center">
              <p className="text-3xl" aria-hidden="true">🏘️</p>
              <p className="mt-2 font-semibold text-ink">No stores within {radius} km yet</p>
              <p className="mt-1 text-sm text-neutral-500">We&apos;re adding kitchens and suppliers every week. If this location looks wrong, update it above.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-7">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>
      </div>
      <ViewCartBar />
    </div>
  );
}
