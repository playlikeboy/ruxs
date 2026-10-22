import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModeSwitch } from "@/features/consumer/components/mode-switch";
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

  // Kids categories live behind the Daily ↔ Kids switch, not in the Daily grid.
  const dailyCategories = categories.filter((k) => k.vendorType !== "kids" && k.id !== "kids-kits");
  const serviceCategories = dailyCategories.length > 0 ? (
    <section className="mt-6" aria-labelledby="service-categories-heading">
      <h2 id="service-categories-heading" className="text-[17px] font-bold tracking-tight text-ink">What do you need?</h2>
      <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
        {dailyCategories.map((k) => (
          <Link key={k.id} href={"/app/category/" + k.id} className="group flex flex-col items-center gap-1.5 text-center active:scale-95">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-[20px] text-[30px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.05)] ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5"
              style={{ background: `linear-gradient(160deg, ${k.coverFrom}, ${k.coverTo})` }}
              aria-hidden="true"
            >
              {k.emoji}
            </span>
            <span className="line-clamp-2 text-[12px] font-medium leading-tight text-ink">{k.shortLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <div className="pb-24">
      <div className="space-y-3 px-4 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <ModeSwitch />
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
          className="mt-6 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFE1EF] via-[#EDE3FF] to-[#D9F4FF] p-4 transition active:scale-[0.99]"
        >
          <span className="text-4xl" aria-hidden="true">🧸</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold leading-tight text-[#3B1F5C]">Switch to Kids</span>
            <span className="mt-0.5 block text-xs leading-5 text-[#3B1F5C]/70">Robotics, chess, art, dance and DIY kits near you.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#9B5CF6]" aria-hidden="true" />
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
