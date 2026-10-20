import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { getMyLocation, getMyPlans, getMyProfile, listStores } from "@/features/consumer/queries";
import { getCategoryMap } from "@/features/platform/queries";
import { TodayCard, type TodayItem } from "@/features/consumer/components/today-card";
import { HeroSubscriptionPlans, type HeroPlanItem } from "@/features/consumer/components/hero-subscription-plans";
import { isLate } from "@/core/cutoff";
import { weekdayIST } from "@/core/time";
import { getCategories, getPlatformSettings } from "@/features/platform/queries";
import { LocationChip } from "@/features/consumer/components/location-chip";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreFilterList } from "@/features/consumer/components/store-filter-list";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
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

  const serviceCategories = categories.length > 0 ? (
    <section className="mt-6" aria-labelledby="service-categories-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="service-categories-heading" className="text-lg font-bold tracking-tight text-ink">Explore by service</h2>
          <p className="mt-1 text-sm leading-5 text-neutral-500">Choose what you need. Discover local providers across categories.</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-neutral-500">{categories.length} categories</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {categories.map((k) => {
          const destination =
            k.id === "kids" ? "/app/kids" : k.id === "kids-kits" ? "/app/kids/kits" : "/app/category/" + k.id;
          return (
            <Link
              key={k.id}
              href={destination}
              className="group relative flex min-h-[124px] flex-col justify-between overflow-hidden rounded-2xl border border-black/5 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100 active:scale-[0.98]"
            >
              <span className="relative z-10 max-w-[76%] text-[15px] font-semibold leading-tight text-ink">{k.label}</span>
              <span className="relative z-10 max-w-[76%] text-[11px] leading-4 text-neutral-600">{k.blurb}</span>
              <span className="absolute bottom-2 right-3 text-[38px] leading-none" aria-hidden="true">{k.emoji}</span>
              <span className="absolute right-3 top-3 text-neutral-400 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  ) : null;

  return (
    <div className="pb-24">
      <div className="space-y-4 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <LocationChip label={location.label} source={location.source} />
        <SearchBar />
        <InstallAppPrompt variant="banner" />
      </div>

      <div className="px-4">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          {firstName ? `Hi ${firstName},` : "Hi there,"}
          <br />
          <span className="text-neutral-500">what does home need today?</span>
        </h1>

        {plans.length === 0 && serviceCategories}

        <HeroSubscriptionPlans plans={heroPlans} today={today} category={category} />

        {todayItems.length > 0 && (
          <div className="mt-5">
            <TodayCard items={todayItems} today={today} />
          </div>
        )}

        {plans.length > 0 && serviceCategories}

        <Link
          href="/app/kids"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100 active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white text-accent">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Family learning</span>
              <span className="mt-1 block text-base font-bold leading-tight text-ink">Kids activities &amp; learning</span>
              <span className="mt-1 block text-xs leading-5 text-neutral-600">Robotics, chess, arts, sports and hands-on kits.</span>
            </span>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </Link>

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
            <div className="mt-4">
              <StoreFilterList stores={stores} radius={radius} />
            </div>
          )}
        </section>
      </div>
      <ViewCartBar />
    </div>
  );
}
