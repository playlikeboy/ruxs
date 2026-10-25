import Link from "next/link";
import { ArrowRight, House, MapPin } from "lucide-react";
import { RuxsMark } from "@/components/marketing/ruxs-mark";
import { CoverArt } from "@/components/ui/cover-art";
import { getMyLocation, getMyPlans, getMyProfile, getSearchRadius, listStores } from "@/features/consumer/queries";
import { getCategoryMap } from "@/features/platform/queries";
import { TodayCard, type TodayItem } from "@/features/consumer/components/today-card";
import { HeroSubscriptionPlans, type HeroPlanItem } from "@/features/consumer/components/hero-subscription-plans";
import { isLate } from "@/core/cutoff";
import { isKidsVendorType } from "@/core/vendor-types";
import { weekdayIST } from "@/core/time";
import { getCategories } from "@/features/platform/queries";
import { LocationChip } from "@/features/consumer/components/location-chip";
import { SearchRadiusPicker } from "@/features/consumer/components/search-radius-picker";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreFilterList } from "@/features/consumer/components/store-filter-list";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { CategoryTile } from "@/components/ui/category-tile";
import { getKidsActivities } from "@/features/kids/queries";
import { formatINR } from "@/core/money";
import { getHomeBanners } from "@/features/banners/queries";
import { HeroCarousel } from "@/features/banners/components/hero-carousel";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";

export const metadata = { title: "Explore" };

export default async function ExplorePage() {
  const { user, profile } = await getMyProfile();
  const [location, categories, searchRadius] = await Promise.all([getMyLocation(), getCategories(), getSearchRadius()]);
  // listStores already applies the geofence: only stores within the household's search radius come back.
  const stores = await listStores({ latitude: location.latitude, longitude: location.longitude });
  const radius = searchRadius.km;

  // Plans that deliver today, for the "receive today?" card.
  const [{ today, plans }, category, kidsActivities, banners] = await Promise.all([getMyPlans(), getCategoryMap(), getKidsActivities(), getHomeBanners()]);
  const weekday = weekdayIST(today);
  const now = new Date();
  const todayItems: TodayItem[] = plans
    .filter((p) => p.sub.days.includes(weekday) && p.sub.startsOn <= today && (!p.sub.endsOn || p.sub.endsOn >= today))
    .map((p) => {
      const change = p.changes.find((c) => c.serviceDate === today);
      return {
        subscriptionId: p.sub.id,
        kind: p.product.kind,
        productName: p.product.name,
        vendorName: p.vendorName,
        qty: change?.kind === "extra" ? p.sub.qty + change.qty : change?.kind === "qty" ? change.qty : p.sub.qty,
        unit: p.product.assetName ?? "unit",
        cutoffAt: p.product.cutoffAt,
        skipped: change?.kind === "skip",
        locked: isLate(now, today, p.product.cutoffAt),
      };
    });

  const heroPlans: HeroPlanItem[] = plans.map((p) => {
    const change = p.changes.find((c) => c.serviceDate === today);
    const isScheduledToday = p.sub.days.includes(weekday) && p.sub.startsOn <= today && (!p.sub.endsOn || p.sub.endsOn >= today);
    return {
      id: p.sub.id,
      productName: p.product.name,
      vendorName: p.vendorName,
      vendorSlug: p.vendorSlug,
      imageUrl: p.product.imageUrl,
      kind: p.product.kind,
      pricePaise: p.product.pricePaise,
      qty: p.sub.qty,
      shift: p.product.shift,
      cutoffAt: p.product.cutoffAt,
      days: p.sub.days,
      isDeliveringToday: isScheduledToday && change?.kind !== "skip",
      isSkippedToday: change?.kind === "skip",
    };
  });

  const firstName = (profile?.name ?? user.displayName ?? "").split(" ")[0];

  // One grid for everything households can get, kids included.
  const daily = categories.filter((k) => !isKidsVendorType(k.vendorType) && k.id !== "kids-kits");
  const tiles = [
    ...daily.map((k) => ({ id: k.id, label: k.shortLabel, href: "/app/category/" + k.id, tint: k.tint })),
    { id: "kids", label: "Kids classes", href: "/app/kids/activities", tint: "#E9F4E7" },
    { id: "kids-kits", label: "Learning kits", href: "/app/kids/kits", tint: "#FFF4D8" },
  ];
  const kidsRail = kidsActivities.slice(0, 8);

  return (
    <div className="pb-24">
      <div className="space-y-3 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <Link href="/app" aria-label="RUXs home" className="inline-flex items-center gap-2 rounded-xl">
            <RuxsMark className="h-9 w-9 shrink-0" aria-hidden="true" />
            <span className="text-lg font-extrabold tracking-[-0.03em] text-brand-deep">RUXs</span>
          </Link>
          <LocationChip label={location.label} source={location.source} />
        </header>
        <SearchBar />
      </div>

      <div className="px-4">
        <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-tight text-ink">
          {firstName ? `Hi ${firstName}, what does home need today?` : "What does home need today?"}
        </h1>

        <HeroCarousel slides={banners} />

        <InstallAppPrompt variant="banner" className="mt-3" />

        <HeroSubscriptionPlans plans={heroPlans} today={today} category={category} />

        {todayItems.length > 0 && (
          <div className="mt-5">
            <TodayCard items={todayItems} today={today} />
          </div>
        )}

        <section className="mt-6" aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="sr-only">Categories</h2>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {tiles.map((t) => (
              <CategoryTile key={t.id} {...t} />
            ))}
          </div>
        </section>

        {kidsRail.length > 0 && (
          <section className="mt-8" aria-labelledby="kids-heading">
            <div className="flex items-end justify-between gap-3">
              <h2 id="kids-heading" className="text-xl font-bold tracking-tight text-ink">Kids classes near you</h2>
              <Link href="/app/kids/activities" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                See all <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {kidsRail.map((a) => (
                <li key={a.id} className="w-[220px] shrink-0 snap-start">
                  <Link href={`/app/kids/services/${a.id}`} className="group block h-full overflow-hidden rounded-[16px] border border-line bg-surface transition-colors hover:border-ink/30">
                    <CoverArt theme={a.category} className="h-24 w-full" />
                    <span className="block p-3.5 pt-3">
                    <span className="line-clamp-2 block text-[15px] font-semibold leading-snug text-ink">{a.name}</span>
                    <span className="mt-1 block truncate text-sm text-muted">{a.vendor.name}</span>
                    <span className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted">Ages {a.ageMin}–{a.ageMax}</span>
                      <span className="font-semibold tabular-nums text-ink">{formatINR(a.pricePaise)}</span>
                    </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8" aria-labelledby="stores-heading">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="stores-heading" className="text-xl font-bold tracking-tight text-ink">Stores near you</h2>
              {location.source !== "none" && (
                <p className="text-sm text-muted tabular-nums">
                  {stores.length} {stores.length === 1 ? "store" : "stores"} within {radius} km
                </p>
              )}
            </div>
            <SearchRadiusPicker km={radius} />
          </div>
          {location.source === "none" ? (
            <div className="mt-4 rounded-[16px] bg-app-canvas p-6 text-center">
              <MapPin className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
              <p className="mt-2 font-semibold text-ink">Share your location to see stores</p>
              <p className="mt-1 text-sm text-muted">We only show kitchens and suppliers within {radius} km of you. Tap your location above, or add your address.</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="mt-4 rounded-[16px] bg-app-canvas p-6 text-center">
              <House className="mx-auto h-8 w-8 text-brand-deep" aria-hidden="true" />
              <p className="mt-2 font-semibold text-ink">No stores within {radius} km yet</p>
              <p className="mt-1 text-sm text-muted">Try a wider radius, or check your location above. We&apos;re adding kitchens and suppliers every week.</p>
            </div>
          ) : (
            <div className="mt-4">
              <StoreFilterList stores={stores} />
            </div>
          )}
        </section>

      </div>
      <ViewCartBar />
    </div>
  );
}
