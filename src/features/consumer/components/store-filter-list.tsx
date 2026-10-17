"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Check, Search, Sparkles, Star, MapPin, Tag, MessageSquare, Zap } from "lucide-react";
import type { StoreCard as StoreCardData } from "@/features/consumer/queries";
import { StoreCard } from "./store-card";

type SortOption = "recommended" | "rating" | "distance" | "price" | "reviews";

const SORT_LABELS: Record<SortOption, { label: string; icon: typeof Star }> = {
  recommended: { label: "Recommended", icon: Sparkles },
  rating: { label: "Top Rated", icon: Star },
  distance: { label: "Nearest First", icon: MapPin },
  price: { label: "Lowest Price", icon: Tag },
  reviews: { label: "Most Reviews", icon: MessageSquare },
};

export function StoreFilterList({
  stores,
  radius: _radius,
}: {
  stores: StoreCardData[];
  radius: number;
}) {
  const [sort, setSort] = useState<SortOption>("recommended");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlySubscription, setOnlySubscription] = useState(false);
  const [query, setQuery] = useState("");
  const [showSortSheet, setShowSortSheet] = useState(false);

  // Extract all unique categories present in the current store list
  const availableCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const store of stores) {
      store.kinds.forEach((kind, i) => {
        const label = store.kindLabels[i] ?? kind;
        if (!map.has(kind)) map.set(kind, label);
      });
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [stores]);

  const filteredStores = useMemo(() => {
    let list = [...stores];

    // Filter by text query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.kindLabels.some((k) => k.toLowerCase().includes(q)) ||
          s.matchedItems.some((item) => item.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      list = list.filter((s) => s.kinds.includes(filterCategory));
    }

    // Filter by open now
    if (onlyOpen) {
      list = list.filter((s) => s.acceptingOrders);
    }

    // Filter by subscriptions available
    if (onlySubscription) {
      list = list.filter((s) => s.hasSubscriptions);
    }

    // Sort list
    list.sort((a, b) => {
      // In-range stores always come first
      if (a.inRange !== b.inRange) return a.inRange ? -1 : 1;

      if (sort === "recommended") {
        if (a.acceptingOrders !== b.acceptingOrders) return a.acceptingOrders ? -1 : 1;
        const aRating = a.rating.average ?? 3.5;
        const bRating = b.rating.average ?? 3.5;
        if (bRating !== aRating) return bRating - aRating;
        const aDist = a.distanceKm ?? 999;
        const bDist = b.distanceKm ?? 999;
        return aDist - bDist;
      }

      if (sort === "rating") {
        const aRating = a.rating.average ?? 0;
        const bRating = b.rating.average ?? 0;
        if (bRating !== aRating) return bRating - aRating;
        return b.rating.count - a.rating.count;
      }

      if (sort === "distance") {
        const aDist = a.distanceKm ?? 999;
        const bDist = b.distanceKm ?? 999;
        return aDist - bDist;
      }

      if (sort === "price") {
        return a.minPricePaise - b.minPricePaise;
      }

      if (sort === "reviews") {
        return b.rating.count - a.rating.count;
      }

      return 0;
    });

    return list;
  }, [stores, sort, filterCategory, onlyOpen, onlySubscription, query]);

  const activeFiltersCount =
    (filterCategory !== "all" ? 1 : 0) + (onlyOpen ? 1 : 0) + (onlySubscription ? 1 : 0) + (sort !== "recommended" ? 1 : 0);

  const clearAllFilters = () => {
    setFilterCategory("all");
    setOnlyOpen(false);
    setOnlySubscription(false);
    setSort("recommended");
    setQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Quick Search & Sort Header Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within nearby stores…"
            className="h-10 w-full rounded-xl border border-black/10 bg-neutral-50/80 pl-9 pr-3 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:bg-white focus:outline-none transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-ink"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.vibrate?.([10]);
            setShowSortSheet(true);
          }}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink shadow-2xs transition active:scale-95"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-accent" />
          <span className="hidden sm:inline">Sort:</span>
          <span className="font-bold text-accent">{SORT_LABELS[sort].label}</span>
        </button>
      </div>

      {/* Horizontal Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => {
            navigator.vibrate?.([10]);
            setFilterCategory("all");
          }}
          className={
            "flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 " +
            (filterCategory === "all"
              ? "bg-ink text-white shadow-2xs"
              : "border border-black/10 bg-white text-neutral-600 hover:border-black/20")
          }
        >
          All Stores ({stores.length})
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.vibrate?.([10]);
            setOnlyOpen(!onlyOpen);
          }}
          className={
            "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 " +
            (onlyOpen
              ? "bg-accent text-white shadow-2xs"
              : "border border-black/10 bg-white text-neutral-600 hover:border-black/20")
          }
        >
          <Zap className="h-3 w-3" />
          Open Now
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.vibrate?.([10]);
            setOnlySubscription(!onlySubscription);
          }}
          className={
            "flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 " +
            (onlySubscription
              ? "bg-ink text-white shadow-2xs"
              : "border border-black/10 bg-white text-neutral-600 hover:border-black/20")
          }
        >
          Subscriptions
        </button>

        {availableCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              navigator.vibrate?.([10]);
              setFilterCategory(filterCategory === c.id ? "all" : c.id);
            }}
            className={
              "flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 " +
              (filterCategory === c.id
                ? "bg-ink text-white shadow-2xs"
                : "border border-black/10 bg-white text-neutral-600 hover:border-black/20")
            }
          >
            {c.label}
          </button>
        ))}

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex shrink-0 items-center text-xs font-bold text-accent hover:underline px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          Showing <strong className="font-semibold text-ink">{filteredStores.length}</strong> of {stores.length} nearby stores
        </span>
        {sort !== "recommended" && (
          <span>
            Sorted by <span className="font-medium text-ink">{SORT_LABELS[sort].label}</span>
          </span>
        )}
      </div>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-neutral-50/50 p-8 text-center">
          <p className="text-3xl" aria-hidden="true">🔍</p>
          <p className="mt-2 text-sm font-semibold text-ink">No stores match your filters</p>
          <p className="mt-1 text-xs text-neutral-500">Try changing your search term or clearing active filters.</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-ink px-4 text-xs font-bold text-white shadow-2xs"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {/* Native Sort Bottom Sheet / Modal */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <ArrowUpDown className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-ink">Sort Stores By</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSortSheet(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="mt-3 divide-y divide-black/5">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => {
                const opt = SORT_LABELS[key];
                const Icon = opt.icon;
                const isSelected = sort === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      navigator.vibrate?.([10]);
                      setSort(key);
                      setShowSortSheet(false);
                    }}
                    className={
                      "flex h-12 w-full items-center justify-between px-2 text-sm font-medium transition " +
                      (isSelected ? "text-accent font-bold" : "text-ink hover:text-accent")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-accent" : "text-neutral-400"}`} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
