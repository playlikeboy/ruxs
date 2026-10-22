"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  filterKidsActivities,
  type KidsAgeBracketId,
  type KidsCategoryId,
  type KidsFormat,
  KIDS_FORMATS,
} from "@/core/kids";
import { KidsAgeFilter } from "./kids-age-filter";
import { KidsCategoryStrip } from "./kids-category-strip";
import { KidsActivityCard } from "./kids-activity-card";
import type { KidsActivityItem } from "../types";

export function KidsActivitiesView({ initialActivities }: { initialActivities: KidsActivityItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ageBracket, setAgeBracket] = useState<KidsAgeBracketId>("all");
  const [category, setCategory] = useState<KidsCategoryId>("all");
  const [format, setFormat] = useState<KidsFormat>("all");

  const filtered = useMemo(() => {
    return filterKidsActivities(
      initialActivities.map((act) => ({
        ...act,
        minAge: act.ageMin,
        maxAge: act.ageMax,
      })),
      {
        ageBracket,
        category,
        format,
        searchQuery,
      }
    );
  }, [initialActivities, ageBracket, category, format, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search robotics, chess, pottery, karate…"
          className="w-full rounded-[20px] border-2 border-kids-grape/15 bg-white py-2.5 pl-10 pr-4 text-xs font-bold text-kids-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[0_3px_0_rgba(155,92,246,0.18)]"
        />
      </div>

      {/* Category Pills */}
      <KidsCategoryStrip selected={category} onChange={setCategory} />

      {/* Age Group Pills */}
      <KidsAgeFilter selected={ageBracket} onChange={setAgeBracket} />

      {/* Format Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(["all", "studio", "home_visit", "online_live"] as KidsFormat[]).map((fmtKey) => {
          const fmt = KIDS_FORMATS[fmtKey];
          const isSelected = format === fmtKey;
          return (
            <button
              key={fmtKey}
              type="button"
              onClick={() => setFormat(fmtKey)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                isSelected
                  ? "border border-kids-grape/20 bg-kids-grape text-white"
                  : "border border-slate-200 bg-white text-kids-ink/70 hover:border-slate-400"
              }`}
            >
              <span aria-hidden="true">{fmt.emoji}</span>
              <span>{fmt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Result Counter */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-xs font-black text-kids-ink/80">
          Showing {filtered.length} {filtered.length === 1 ? "activity" : "activities"}
        </span>
        {(ageBracket !== "all" || category !== "all" || format !== "all" || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setAgeBracket("all");
              setCategory("all");
              setFormat("all");
              setSearchQuery("");
            }}
            className="text-[11px] font-bold text-kids-grape hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Activity Cards List */}
      {filtered.length === 0 ? (
        <div className="rounded-[26px] border-2 border-dashed border-slate-300 bg-amber-50/60 p-8 text-center">
          <span className="text-4xl" aria-hidden="true">🐣</span>
          <p className="mt-2 text-sm font-black text-kids-ink">No activities match your filters</p>
          <p className="mt-1 text-xs font-semibold text-kids-ink/60">
            Try clearing filters or selecting another age group.
          </p>
          <button
            type="button"
            onClick={() => {
              setAgeBracket("all");
              setCategory("all");
              setFormat("all");
              setSearchQuery("");
            }}
            className="mt-3 rounded-full border-2 border-kids-grape/15 bg-kids-sunny/80 px-4 py-1.5 text-xs font-black shadow-[0_3px_0_rgba(155,92,246,0.18)]"
          >
            Show All Activities
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <KidsActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
