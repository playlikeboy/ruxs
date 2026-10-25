"use client";

import { useMemo, useState } from "react";
import type { StoreCard as StoreCardData } from "@/features/consumer/queries";
import { StoreCard } from "./store-card";

type SortOption = "recommended" | "distance" | "rating" | "price";

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  distance: "Nearest",
  rating: "Top rated",
  price: "Lowest price",
};

const PAGE = 8;

const chip = (on: boolean) =>
  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " + (on ? "bg-ink text-white" : "border border-line bg-surface text-ink/80 hover:border-ink/30");

/** Filter chips, a sort and "Show more" paging over the stores the server already geofenced. */
export function StoreFilterList({ stores }: { stores: StoreCardData[] }) {
  const [sort, setSort] = useState<SortOption>("recommended");
  const [category, setCategory] = useState("all");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlySubscription, setOnlySubscription] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of stores) s.kinds.forEach((k, i) => map.has(k) || map.set(k, s.kindLabels[i] ?? k));
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [stores]);

  const list = useMemo(() => {
    const filtered = stores.filter(
      (s) => (category === "all" || s.kinds.includes(category)) && (!onlyOpen || s.acceptingOrders) && (!onlySubscription || s.hasSubscriptions)
    );
    const dist = (s: StoreCardData) => s.distanceKm ?? 999;
    return filtered.sort((a, b) => {
      if (a.inRange !== b.inRange) return a.inRange ? -1 : 1;
      if (sort === "distance") return dist(a) - dist(b);
      if (sort === "price") return a.minPricePaise - b.minPricePaise;
      if (sort === "rating") return (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.rating.count - a.rating.count;
      if (a.acceptingOrders !== b.acceptingOrders) return a.acceptingOrders ? -1 : 1;
      return (b.rating.average ?? 3.5) - (a.rating.average ?? 3.5) || dist(a) - dist(b);
    });
  }, [stores, sort, category, onlyOpen, onlySubscription]);

  const filtering = category !== "all" || onlyOpen || onlySubscription;
  const reset = () => {
    setCategory("all");
    setOnlyOpen(false);
    setOnlySubscription(false);
    setShown(PAGE);
  };
  const pick = (fn: () => void) => () => {
    fn();
    setShown(PAGE);
  };

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <label className="sr-only" htmlFor="store-sort">Sort stores</label>
        <select
          id="store-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-9 shrink-0 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
            <option key={k} value={k}>{SORT_LABELS[k]}</option>
          ))}
        </select>
        <button type="button" aria-pressed={onlyOpen} onClick={pick(() => setOnlyOpen(!onlyOpen))} className={chip(onlyOpen)}>Open now</button>
        <button type="button" aria-pressed={onlySubscription} onClick={pick(() => setOnlySubscription(!onlySubscription))} className={chip(onlySubscription)}>Subscriptions</button>
        {categories.length > 1 &&
          categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={category === c.id} onClick={pick(() => setCategory(category === c.id ? "all" : c.id))} className={chip(category === c.id)}>
              {c.label}
            </button>
          ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-[16px] bg-app-canvas p-6 text-center">
          <p className="font-semibold text-ink">No stores match these filters</p>
          <button type="button" onClick={reset} className="mt-2 text-sm font-semibold text-accent">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {list.slice(0, shown).map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
          {list.length > shown ? (
            <button
              type="button"
              onClick={() => setShown(shown + PAGE)}
              className="h-11 w-full rounded-full border border-line bg-surface text-sm font-semibold text-ink hover:border-ink/30"
            >
              Show more ({list.length - shown} left)
            </button>
          ) : (
            filtering && <button type="button" onClick={reset} className="block w-full text-center text-sm font-semibold text-accent">Clear filters</button>
          )}
        </>
      )}
    </div>
  );
}
