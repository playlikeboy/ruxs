import Link from "next/link";
import { getMyProfile, listStores } from "@/features/consumer/queries";
import { SERVICE_KINDS } from "@/config/service-kinds";
import { LocationChip } from "@/features/consumer/components/location-chip";
import { SearchBar } from "@/features/consumer/components/search-bar";
import { StoreCard } from "@/features/consumer/components/store-card";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";

export const metadata = { title: "Explore" };

export default async function ExplorePage() {
  const { user, profile } = await getMyProfile();
  const stores = await listStores({ latitude: profile?.latitude, longitude: profile?.longitude });
  const nearby = stores.filter((s) => s.inRange);
  const farther = stores.filter((s) => !s.inRange);
  const firstName = (profile?.name ?? user.displayName ?? "").split(" ")[0];

  return (
    <div className="pb-24">
      <div className="space-y-4 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <LocationChip
          label={profile ? `${profile.society}, ${profile.area}` : null}
          hasPoint={profile?.latitude != null}
        />
        <SearchBar />
      </div>

      <div className="px-4">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          {firstName ? `Hi ${firstName},` : "Hi there,"}
          <br />
          <span className="text-neutral-500">what does home need today?</span>
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {SERVICE_KINDS.map((k) => (
            <Link
              key={k.id}
              href={`/app/category/${k.id}`}
              className={"relative flex h-[104px] flex-col justify-between overflow-hidden rounded-2xl p-3.5 transition active:scale-[0.98] " + k.tint}
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
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {profile?.latitude != null ? "Delivering to you" : "Popular on RUXS"}
            </h2>
            <span className="text-sm text-neutral-500 tabular-nums">{nearby.length} stores</span>
          </div>
          {nearby.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-neutral-50 p-6 text-center">
              <p className="text-3xl" aria-hidden="true">🏘️</p>
              <p className="mt-2 font-semibold text-ink">No stores deliver here yet</p>
              <p className="mt-1 text-sm text-neutral-500">We&apos;re adding kitchens and suppliers every week. Check the ones a little farther away below.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-7">
              {nearby.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>

        {farther.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold tracking-tight text-ink">A little farther</h2>
            <p className="mt-1 text-sm text-neutral-500">These stores don&apos;t reach your address yet.</p>
            <div className="mt-4 space-y-7 opacity-80">
              {farther.slice(0, 12).map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}
      </div>
      <ViewCartBar />
    </div>
  );
}
