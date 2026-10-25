import { vendorPricing } from "@/core/pricing";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublicTypeDetails } from "@/features/vendor-types/queries";
import { ChevronLeft, MapPin, Repeat } from "lucide-react";
import { getProviderPublic } from "@/features/bookings/queries";
import { ProviderPage } from "@/features/bookings/components/provider-page";
import { formatINR } from "@/core/money";
import { isKidsVendorType } from "@/core/vendor-types";
import { getCategoryMap } from "@/features/platform/queries";
import { getMyLocation, getStore } from "@/features/consumer/queries";
import { AddToCart } from "@/features/consumer/components/add-to-cart";
import { StoreCover } from "@/features/consumer/components/store-cover";
import { VegMark } from "@/features/consumer/components/veg-mark";
import { ViewCartBar } from "@/features/consumer/components/view-cart-bar";
import { RatingBadge } from "@/features/reviews/components/rating-badge";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewList } from "@/features/reviews/components/review-list";
import { canReplyToStoreReviews, getMyReviewState, getStoreReviewsPaginated } from "@/features/reviews/queries";
import { ReportStoreButton } from "@/features/support/components/report-button";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [location, category] = await Promise.all([getMyLocation(), getCategoryMap()]);
  const store = await getStore(slug, { latitude: location.latitude, longitude: location.longitude });
  if (!store) notFound();

  const { vendor, items } = store;
  // Kids academies have their own playful profile page in Kids mode.
  if (isKidsVendorType(vendor.vendorType) && vendor.vendorType !== "kids_products") redirect(`/app/kids/providers/${vendor.slug}`);
  const [reviewData, myReview, canReply] = await Promise.all([
    getStoreReviewsPaginated(vendor.id, 1, 10),
    getMyReviewState(vendor.id),
    canReplyToStoreReviews(vendor.slug),
  ]);

  // Trainers, physiotherapists and other booking providers get a profile page, not a menu.
  if (vendor.businessType === "booking") {
    const provider = await getProviderPublic(vendor.id);
    const firstCategory = category(provider.services[0]?.category.id ?? "other");
    return (
      <ProviderPage
        vendor={vendor}
        cover={firstCategory}
        categoryLabel={Array.from(new Set(provider.services.map((x) => x.category.label))).join(" · ") || firstCategory.label}
        distanceKm={store.distanceKm}
        visible={store.visible}
        homeVisitsReach={store.inRange}
        searchRadiusKm={store.searchRadiusKm}
        rating={store.rating}
        profile={provider.profile}
        highlights={provider.highlights}
        serviceChips={provider.serviceChips}
        services={provider.services.map((x) => x.service)}
        reviews={reviewData.reviews}
        totalReviews={reviewData.total}
        myReview={myReview}
        canReply={canReply}
      />
    );
  }
  const kinds = Array.from(new Set(items.map((i) => i.kind)));
  const primary = kinds[0] ?? "other";
  const menu = items.filter((i) => i.allowOneTime || i.allowSubscription);
  const sections = new Map<string, typeof menu>();
  for (const item of menu) {
    const key = item.section || category(item.kind).label;
    sections.set(key, [...(sections.get(key) ?? []), item]);
  }
  const canOrder = vendor.acceptingOrders && store.inRange;
  const typeDetails = await getPublicTypeDetails(vendor.id, items.map((i) => i.id));

  const storeInfo = {
    vendorSlug: vendor.slug,
    vendorName: vendor.name,
    deliveryFeePaise: vendor.deliveryFeePaise,
    minOrderPaise: vendor.minOrderPaise,
    pricing: vendorPricing(vendor),
  };

  return (
    <div className="pb-40">
      <div className="relative">
        {vendor.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- merchant-uploaded image host
          <img src={vendor.coverUrl} alt="" className="h-44 w-full object-cover" />
        ) : (
          <StoreCover cover={category(primary)} alt={vendor.name} className="h-44 w-full" />
        )}
        <Link
          href="/app"
          aria-label="Back to explore"
          className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative -mt-5 rounded-t-3xl bg-white px-5 pt-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">{vendor.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
          <a href="#reviews"><RatingBadge rating={store.rating} /></a>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {vendor.area}
            {store.distanceKm != null && ` · ${store.distanceKm < 1 ? "under 1" : store.distanceKm} km`}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          <span className={vendor.acceptingOrders ? "font-medium text-good" : "font-medium text-bad"}>{vendor.acceptingOrders ? "Open" : "Closed"}</span>
          {" · "}
          {vendor.deliveryFeePaise === 0 ? "Free delivery" : `${formatINR(vendor.deliveryFeePaise)} delivery`}
          {" · "}delivers within {vendor.serviceRadiusKm} km
        </p>
        {typeDetails.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {typeDetails.highlights.map((h) => (
              <span key={h} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">{h}</span>
            ))}
          </div>
        )}
        {vendor.description && <p className="mt-3 text-[15px] leading-6 text-neutral-700">{vendor.description}</p>}

        {!store.visible ? (
          <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-sm font-medium text-bad">
            This store is outside your {store.searchRadiusKm} km search radius and doesn&apos;t deliver to you.
          </p>
        ) : (
          !store.inRange && (
            <p className="mt-4 rounded-xl bg-butter px-4 py-3 text-sm font-medium text-warn">
              You&apos;re outside this store&apos;s {vendor.serviceRadiusKm} km delivery area. You can browse, but not order.
            </p>
          )
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight text-ink">Menu</h2>
          {menu.length === 0 && <p className="mt-2 text-sm text-neutral-500">Nothing on the menu yet. Check back soon.</p>}
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
                      {(typeDetails.itemChips.get(item.id) ?? []).length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-1">
                          {(typeDetails.itemChips.get(item.id) ?? []).slice(0, 3).map((c) => (
                            <span key={c} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{c}</span>
                          ))}
                        </p>
                      )}
                      {item.depositPaise > 0 && item.assetName && (
                        <p className="mt-1 text-xs text-neutral-500">+ {formatINR(item.depositPaise)} refundable {item.assetName} deposit on subscriptions</p>
                      )}
                      {item.allowSubscription && item.isAvailable && store.inRange && (
                        <Link href={`/app/store/${vendor.slug}/subscribe/${item.id}`} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                          <Repeat className="h-3.5 w-3.5" aria-hidden="true" /> Subscribe · order by {item.cutoffAt}
                        </Link>
                      )}
                    </div>
                    <div className="relative flex w-24 shrink-0 flex-col items-center">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- merchant-uploaded image host
                        <img src={item.imageUrl} alt="" loading="lazy" className="h-24 w-24 rounded-2xl object-cover" />
                      ) : (
                        <StoreCover cover={category(item.kind)} alt="" className="h-24 w-24 rounded-2xl" />
                      )}
                      {item.allowOneTime && (
                        <div className="-mt-5">
                          <AddToCart
                            store={storeInfo}
                            item={{ productId: item.id, name: item.name, unitPricePaise: item.pricePaise, isVeg: item.isVeg }}
                            disabled={!item.isAvailable || !canOrder}
                          />
                        </div>
                      )}
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
            <ReviewList
              reviews={reviewData.reviews}
              total={reviewData.total}
              vendorId={vendor.id}
              vendorSlug={vendor.slug}
              storeName={vendor.name}
              canReply={canReply}
              pageSize={10}
            />
          </div>
        </section>

        <div className="mt-12 flex justify-center pb-4">
          <ReportStoreButton vendorId={vendor.id} vendorName={vendor.name} />
        </div>
      </div>
      <ViewCartBar onlyFor={vendor.slug} />
    </div>
  );
}
