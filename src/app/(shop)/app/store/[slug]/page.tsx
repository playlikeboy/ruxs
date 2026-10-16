import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, MapPin, Repeat, Truck } from "lucide-react";
import { formatINR } from "@/core/money";
import { getCategoryMap } from "@/features/platform/queries";
import { getMyLocation, getStore } from "@/features/consumer/queries";
import { AddToCart } from "@/features/consumer/components/add-to-cart";
import { StoreCover } from "@/features/consumer/components/store-cover";
import { VegMark } from "@/features/consumer/components/veg-mark";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";
import { RatingBadge } from "@/features/reviews/components/rating-badge";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewList } from "@/features/reviews/components/review-list";
import { getMyReviewState, getStoreReviews } from "@/features/reviews/queries";

const SHIFT_LABEL: Record<string, string> = { lunch: "Lunch", dinner: "Dinner", morning: "Morning", evening: "Evening" };

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [location, category] = await Promise.all([getMyLocation(), getCategoryMap()]);
  const store = await getStore(slug, { latitude: location.latitude, longitude: location.longitude });
  if (!store) notFound();

  const { vendor, items } = store;
  const [reviews, myReview] = await Promise.all([getStoreReviews(vendor.id), getMyReviewState(vendor.id)]);
  const kinds = Array.from(new Set(items.map((i) => i.kind)));
  const primary = kinds[0] ?? "other";
  const plans = items.filter((i) => i.allowSubscription && i.isAvailable);
  const menu = items.filter((i) => i.allowOneTime);
  const sections = new Map<string, typeof menu>();
  for (const item of menu) {
    const key = item.section || category(item.kind).label;
    sections.set(key, [...(sections.get(key) ?? []), item]);
  }
  const canOrder = vendor.acceptingOrders && store.inRange;
  const storeInfo = {
    vendorSlug: vendor.slug,
    vendorName: vendor.name,
    deliveryFeePaise: vendor.deliveryFeePaise,
    minOrderPaise: vendor.minOrderPaise,
  };

  return (
    <div className="pb-40">
      <div className="relative">
        <StoreCover cover={category(primary)} imageUrl={vendor.coverUrl} alt={vendor.name} className="aspect-[4/3] w-full" emojiClass="text-[96px]" />
        <Link
          href="/app"
          aria-label="Back to explore"
          className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-white px-5 pt-6">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">{vendor.name}</h1>
        <a href="#reviews" className="mt-1 inline-flex"><RatingBadge rating={store.rating} /></a>
        <p className="mt-1 text-[15px] text-neutral-600">{kinds.map((k) => category(k).label).join(" · ")}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {vendor.area}, {vendor.city}
          {store.distanceKm != null && <span>· {store.distanceKm < 1 ? "under 1" : store.distanceKm} km away</span>}
        </p>
        {vendor.description && <p className="mt-3 text-[15px] leading-6 text-neutral-700">{vendor.description}</p>}

        <div className="mt-5 grid grid-cols-3 divide-x divide-black/5 rounded-2xl border border-black/10 py-3 text-center">
          <div className="px-2">
            <Truck className="mx-auto h-5 w-5 text-neutral-600" aria-hidden="true" />
            <p className="mt-1 text-[13px] font-semibold text-ink">{vendor.deliveryFeePaise === 0 ? "Free" : formatINR(vendor.deliveryFeePaise)}</p>
            <p className="text-[11px] text-neutral-500">delivery</p>
          </div>
          <div className="px-2">
            <MapPin className="mx-auto h-5 w-5 text-neutral-600" aria-hidden="true" />
            <p className="mt-1 text-[13px] font-semibold text-ink">{vendor.serviceRadiusKm} km</p>
            <p className="text-[11px] text-neutral-500">delivery radius</p>
          </div>
          <div className="px-2">
            <Clock className="mx-auto h-5 w-5 text-neutral-600" aria-hidden="true" />
            <p className={"mt-1 text-[13px] font-semibold " + (vendor.acceptingOrders ? "text-good" : "text-bad")}>
              {vendor.acceptingOrders ? "Open" : "Closed"}
            </p>
            <p className="text-[11px] text-neutral-500">for orders</p>
          </div>
        </div>

        {!store.visible ? (
          <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-sm font-medium text-bad">
            This store is more than {store.discoveryRadiusKm} km from you, so it isn&apos;t available in your area.
          </p>
        ) : (
          !store.inRange && (
            <p className="mt-4 rounded-xl bg-butter px-4 py-3 text-sm font-medium text-warn">
              You&apos;re outside this store&apos;s {vendor.serviceRadiusKm} km delivery area. You can browse, but not order.
            </p>
          )
        )}

        {plans.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="text-xl font-bold tracking-tight text-ink">Subscribe &amp; forget</h2>
            </div>
            <p className="mt-1 text-sm text-neutral-500">Daily delivery, skip any day in one tap, pay once a month.</p>
            <div className="-mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
              {plans.map((p) => (
                <div key={p.id} className="w-[240px] shrink-0 snap-start rounded-2xl border border-black/10 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2">
                    <VegMark isVeg={p.isVeg} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{SHIFT_LABEL[p.shift] ?? p.shift}</span>
                  </div>
                  <h3 className="mt-1.5 line-clamp-1 font-semibold text-ink">{p.name}</h3>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    <span className="font-semibold text-ink tabular-nums">{formatINR(p.pricePaise)}</span> / day · order by {p.cutoffAt}
                  </p>
                  {p.depositPaise > 0 && p.assetName && (
                    <p className="mt-0.5 text-xs text-neutral-500">+ {formatINR(p.depositPaise)} refundable {p.assetName} deposit</p>
                  )}
                  {store.inRange ? (
                    <Link href={`/app/store/${vendor.slug}/subscribe/${p.id}`} className="mt-3 flex h-10 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
                      Subscribe
                    </Link>
                  ) : (
                    <span className="mt-3 flex h-10 items-center justify-center rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-400">Not in your area</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight text-ink">Order now</h2>
          {menu.length === 0 && <p className="mt-2 text-sm text-neutral-500">This store only takes subscriptions.</p>}
          {Array.from(sections.entries()).map(([title, list]) => (
            <div key={title} className="mt-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-neutral-500">{title}</h3>
              <ul className="divide-y divide-black/5">
                {list.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5">
                    <div className="min-w-0 flex-1">
                      <VegMark isVeg={item.isVeg} />
                      <h4 className="mt-1 text-[16px] font-semibold text-ink">{item.name}</h4>
                      <p className="mt-0.5 text-[15px] font-medium text-ink tabular-nums">{formatINR(item.pricePaise)}</p>
                      {item.description && <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-neutral-500">{item.description}</p>}
                      {item.depositPaise > 0 && item.assetName && (
                        <p className="mt-1 text-xs text-neutral-500">Returnable {item.assetName} · deposit on subscriptions</p>
                      )}
                      {item.allowSubscription && item.isAvailable && store.inRange && (
                        <Link href={`/app/store/${vendor.slug}/subscribe/${item.id}`} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                          <Repeat className="h-3.5 w-3.5" aria-hidden="true" /> Repeat on days you choose
                        </Link>
                      )}
                    </div>
                    <div className="relative flex w-28 shrink-0 flex-col items-center">
                      <StoreCover cover={category(item.kind)} imageUrl={item.imageUrl} alt="" className="h-28 w-28 rounded-2xl" emojiClass="text-5xl" />
                      <div className="-mt-5">
                        <AddToCart
                          store={storeInfo}
                          item={{ productId: item.id, name: item.name, unitPricePaise: item.pricePaise, isVeg: item.isVeg }}
                          disabled={!item.isAvailable || !canOrder}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="reviews" className="mt-10 scroll-mt-4">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-ink">Ratings &amp; reviews</h2>
            <RatingBadge rating={store.rating} />
          </div>
          {myReview.eligible && (
            <div className="mt-4">
              <ReviewForm vendorSlug={vendor.slug} initialRating={myReview.mine?.rating} initialComment={myReview.mine?.comment} />
            </div>
          )}
          <div className="mt-2">
            <ReviewList reviews={reviews} storeName={vendor.name} />
          </div>
        </section>
      </div>
      <ViewCartBar onlyFor={vendor.slug} />
    </div>
  );
}
