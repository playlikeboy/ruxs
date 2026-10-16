import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatINR } from "@/core/money";
import type { StoreCard as StoreCardData } from "@/features/consumer/queries";
import { StoreCover } from "./store-cover";
import { RatingBadge } from "@/features/reviews/components/rating-badge";

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link href={`/app/store/${store.slug}`} className="group block" aria-label={store.name}>
      <div className="relative overflow-hidden rounded-2xl">
        <StoreCover
          cover={store.cover}
          imageUrl={store.coverUrl}
          alt=""
          className="aspect-[16/10] w-full transition-transform duration-300 group-hover:scale-[1.02]"
          emojiClass="text-7xl"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {store.hasSubscriptions && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
              Subscribe &amp; save
            </span>
          )}
          {!store.acceptingOrders && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
              Closed now
            </span>
          )}
        </div>
        {!store.inRange && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs font-medium text-white">
            Outside delivery area
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink">{store.name}</h3>
            <RatingBadge rating={store.rating} className="shrink-0" />
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {store.area}
            {store.distanceKm != null && <span>· {store.distanceKm < 1 ? "<1" : store.distanceKm} km</span>}
          </p>
          <p className="mt-0.5 truncate text-sm text-neutral-500">
            {store.kindLabels.join(" · ")}
            {store.matchedItems.length > 0 && <span className="text-ink"> · {store.matchedItems.slice(0, 2).join(", ")}</span>}
          </p>
        </div>
        <p className="shrink-0 text-right text-sm text-ink">
          <span className="text-neutral-500">from </span>
          <span className="font-semibold tabular-nums">{formatINR(store.minPricePaise)}</span>
        </p>
      </div>
    </Link>
  );
}
