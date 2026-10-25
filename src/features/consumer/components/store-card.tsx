import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { formatINR } from "@/core/money";
import type { StoreCard as StoreCardData } from "@/features/consumer/queries";
import { StoreCover } from "./store-cover";
import { Stars } from "@/features/reviews/components/rating-badge";

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link href={`/app/store/${store.slug}`} className="group block" aria-label={store.name}>
      <div className="relative overflow-hidden rounded-2xl">
        <StoreCover
          cover={store.cover}
          alt=""
          className="aspect-[16/10] w-full transition-transform duration-300 group-hover:scale-[1.02]"
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
        {store.rating.average != null ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur-xs">
            <Star className="h-3.5 w-3.5 fill-[#E8A33D] text-[#E8A33D]" aria-hidden="true" />
            <span className="tabular-nums">{store.rating.average.toFixed(1)}</span>
            <span className="text-[11px] font-normal text-neutral-500">({store.rating.count})</span>
          </div>
        ) : (
          <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-good shadow-sm backdrop-blur-xs">
            New
          </div>
        )}
        {!store.inRange && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs font-medium text-white">
            Outside delivery area
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-ink">{store.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5">
            {store.rating.average != null ? (
              <>
                <Stars value={store.rating.average} size="h-3.5 w-3.5" />
                <span className="text-xs font-semibold tabular-nums text-ink">{store.rating.average.toFixed(1)}</span>
                <span className="text-xs text-neutral-500 tabular-nums">({store.rating.count})</span>
              </>
            ) : (
              <span className="inline-flex items-center rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-good">
                New
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-neutral-500">
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
