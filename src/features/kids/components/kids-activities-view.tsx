"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import {
  filterKidsActivities,
  KIDS_AGE_BRACKETS,
  KIDS_FORMATS,
  type KidsAgeBracketId,
  type KidsCategoryId,
  type KidsFormat,
} from "@/core/kids";
import { KidsCategoryStrip } from "./kids-category-strip";
import { KidsActivityCard } from "./kids-activity-card";
import type { KidsActivityItem } from "../types";

const FORMATS: KidsFormat[] = ["studio", "home_visit", "online_live"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-kids-ink bg-kids-ink text-white" : "border-kids-ink/15 bg-white text-kids-ink hover:border-kids-ink/40"
      )}
    >
      {children}
    </button>
  );
}

/** Search, one row of topics, and age/format tucked behind Filters. */
export function KidsActivitiesView({
  initialActivities,
  initialQuery = "",
  initialAge = "all",
  initialTopic = "all",
}: {
  initialActivities: KidsActivityItem[];
  initialQuery?: string;
  initialAge?: KidsAgeBracketId;
  initialTopic?: KidsCategoryId;
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [ageBracket, setAgeBracket] = useState<KidsAgeBracketId>(initialAge);
  const [category, setCategory] = useState<KidsCategoryId>(initialTopic);
  const [format, setFormat] = useState<KidsFormat>("all");
  const [showFilters, setShowFilters] = useState(initialAge !== "all");

  const filtered = useMemo(
    () =>
      filterKidsActivities(
        initialActivities.map((act) => ({ ...act, minAge: act.ageMin, maxAge: act.ageMax })),
        { ageBracket, category, format, searchQuery }
      ),
    [initialActivities, ageBracket, category, format, searchQuery]
  );

  const extraFilters = (ageBracket !== "all" ? 1 : 0) + (format !== "all" ? 1 : 0);
  const anyFilter = extraFilters > 0 || category !== "all" || searchQuery !== "";
  const reset = () => {
    setAgeBracket("all");
    setCategory("all");
    setFormat("all");
    setSearchQuery("");
  };
  const ageLabel = KIDS_AGE_BRACKETS.find((b) => b.id === ageBracket)?.label;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search classes</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kids-ink/40" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dance, chess, robotics, art…"
            className="min-h-12 w-full rounded-full border border-kids-ink/15 bg-white pl-10 pr-3 text-base text-kids-ink placeholder:text-kids-ink/40 focus:border-kids-ink focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="kids-filters"
          className={cn(
            "inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
            showFilters || extraFilters ? "border-kids-ink bg-kids-ink text-white" : "border-kids-ink/15 bg-white text-kids-ink"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters{extraFilters ? ` · ${extraFilters}` : ""}
        </button>
      </div>

      <KidsCategoryStrip selected={category} onChange={setCategory} />

      {showFilters && (
        <div id="kids-filters" className="space-y-4 rounded-[20px] border border-kids-ink/10 bg-white p-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-kids-ink">Child&apos;s age</legend>
            <div className="flex flex-wrap gap-2">
              {KIDS_AGE_BRACKETS.map((b) => (
                <Chip key={b.id} active={ageBracket === b.id} onClick={() => setAgeBracket(b.id)}>{b.id === "all" ? "Any age" : b.label}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-kids-ink">Where</legend>
            <div className="flex flex-wrap gap-2">
              <Chip active={format === "all"} onClick={() => setFormat("all")}>Anywhere</Chip>
              {FORMATS.map((f) => (
                <Chip key={f} active={format === f} onClick={() => setFormat(f)}>{KIDS_FORMATS[f].label}</Chip>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="text-sm font-medium text-kids-ink/70">
          {filtered.length} {filtered.length === 1 ? "class" : "classes"}
        </span>
        {ageBracket !== "all" && (
          <button type="button" onClick={() => setAgeBracket("all")} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-kids-mint/50 px-3 text-xs font-medium text-kids-ink">
            {ageLabel} <X className="h-3 w-3" aria-label="Remove" />
          </button>
        )}
        {format !== "all" && (
          <button type="button" onClick={() => setFormat("all")} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-kids-mint/50 px-3 text-xs font-medium text-kids-ink">
            {KIDS_FORMATS[format].label} <X className="h-3 w-3" aria-label="Remove" />
          </button>
        )}
        {anyFilter && (
          <button type="button" onClick={reset} className="ml-auto text-sm font-semibold text-kids-ink underline underline-offset-4">
            Clear all
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-kids-ink/10 bg-white p-8 text-center">
          <p className="text-base font-semibold text-kids-ink">No classes match</p>
          <p className="mt-1 text-sm text-kids-ink/60">Try another age or topic, or clear the filters.</p>
          <button type="button" onClick={reset} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-kids-ink px-5 text-sm font-semibold text-white">
            Show all classes
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <KidsActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
