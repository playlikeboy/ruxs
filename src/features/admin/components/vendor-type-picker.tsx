"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import type { OnboardCategory } from "./vendor-form-values";

function isKids(c: OnboardCategory) {
  return c.id === "kids" || c.id.startsWith("kids_");
}

function fulfilmentLabel(c: OnboardCategory) {
  return c.fulfilment === "booking" ? "Bookable sessions" : "Delivery store";
}

function matches(c: OnboardCategory, q: string) {
  if (!q) return true;
  return [c.label, c.blurb, c.id.replace(/[_-]/g, " "), fulfilmentLabel(c), isKids(c) ? "kids children" : ""]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

/** Step 1 of onboarding: search and pick the business type, which decides the vendor's tables and tools. */
export function VendorTypePicker({ categories, onPick }: { categories: OnboardCategory[]; onPick: (c: OnboardCategory) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const shown = categories.filter((c) => matches(c, q));
    return [
      { id: "daily", title: "Daily essentials & home services", items: shown.filter((c) => !isKids(c)) },
      { id: "kids", title: "RUXs Kids", items: shown.filter(isKids) },
    ].filter((g) => g.items.length > 0);
  }, [categories, q]);
  const first = groups[0]?.items[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">What are you onboarding?</h2>
        <p className="mt-0.5 text-sm text-muted">The type sets up the vendor&apos;s tools and can&apos;t be changed later.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && first) {
              e.preventDefault();
              onPick(first);
            }
          }}
          placeholder="Search: tiffin, dance, physio, kits…"
          aria-label="Search business types"
          className="h-11 w-full rounded-[10px] border border-line bg-surface pl-9 pr-9 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-[10px] bg-bg px-4 py-6 text-center text-sm text-muted">
          No business type matches &ldquo;{query}&rdquo;. Add one in Settings → Categories.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`types-${g.id}`} className="space-y-2">
            <h3 id={`types-${g.id}`} className="flex items-baseline justify-between text-sm font-semibold text-ink">
              {g.title}
              <span className="text-xs font-normal tabular-nums text-muted">{g.items.length}</span>
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {g.items.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick(c)}
                    className={
                      "flex w-full items-center gap-3 rounded-[12px] border bg-surface p-3 text-left transition-colors hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                      (c === first && q ? "border-ink/40" : "border-line")
                    }
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: c.tint }}>
                      <AppIcon name={c.id} className="h-5 w-5 text-ink" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{c.label}</span>
                      <span className="block truncate text-xs text-muted">
                        {fulfilmentLabel(c)}
                        {c.blurb ? ` · ${c.blurb}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      {q && first && <p className="text-xs text-muted">Press Enter to pick {first.label}.</p>}
    </div>
  );
}
