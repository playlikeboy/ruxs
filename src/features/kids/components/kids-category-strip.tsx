"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { cn } from "@/components/ui/cn";
import { KIDS_CATEGORIES, type KidsCategoryId } from "@/core/kids";

const CATEGORY_KEYS: KidsCategoryId[] = ["all", "stem", "arts", "logic", "sports", "music", "kits"];

/** One scrollable row of topics. */
export function KidsCategoryStrip({ selected, onChange }: { selected: KidsCategoryId; onChange: (id: KidsCategoryId) => void }) {
  return (
    <div role="group" aria-label="Topics" className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
      {CATEGORY_KEYS.map((id) => {
        const cat = KIDS_CATEGORIES[id];
        const active = selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              active ? "border-kids-ink bg-kids-ink text-white" : "border-kids-ink/15 bg-white text-kids-ink hover:border-kids-ink/40"
            )}
          >
            <AppIcon name={cat.id} className="h-4 w-4" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
