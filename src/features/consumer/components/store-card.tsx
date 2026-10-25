import Link from "next/link";
import { Star } from "lucide-react";
import { formatINR } from "@/core/money";
import type { StoreCard as StoreCardData } from "@/features/consumer/queries";
import { StoreCover } from "./store-cover";

export function StoreCard({ store }: { store: StoreCardData }) {
  const status = !store.acceptingOrders ? "Closed now" : !store.inRange ? "Outside delivery area" : null;
  return (
    <Link href={`/app/store/${store.slug}`} className="group flex gap-3.5" aria-label={store.name}>
      <StoreCover cover={store.cover} alt="" className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[14px]" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold text-ink group-hover:underline">{store.name}</h3>
          {store.rating.average != null ? (
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold tabular-nums text-ink">
              <Star className="h-3.5 w-3.5 fill-[#E8A33D] text-[#E8A33D]" aria-hidden="true" />
              {store.rating.average.toFixed(1)}
              <span className="font-normal text-muted">({store.rating.count})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-good">New</span>
          )}
        </div>
        <p className="truncate text-sm text-muted">
          {store.kindLabels.join(" · ")} · {store.area}
          {store.distanceKm != null && ` · ${store.distanceKm < 1 ? "<1" : store.distanceKm} km`}
        </p>
        {store.matchedItems.length > 0 && <p className="truncate text-sm text-ink">{store.matchedItems.slice(0, 2).join(", ")}</p>}
        <p className="mt-1 text-sm">
          <span className="text-muted">from </span>
          <span className="font-semibold tabular-nums text-ink">{formatINR(store.minPricePaise)}</span>
          {status ? <span className="text-warn"> · {status}</span> : store.hasSubscriptions && <span className="text-muted"> · Subscribe &amp; save</span>}
        </p>
      </div>
    </Link>
  );
}
