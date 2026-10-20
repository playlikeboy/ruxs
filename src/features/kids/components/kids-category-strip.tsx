"use client";

import { KIDS_CATEGORIES, type KidsCategoryId } from "@/core/kids";

interface KidsCategoryStripProps {
  selected: KidsCategoryId;
  onChange: (category: KidsCategoryId) => void;
}

const CATEGORY_KEYS: KidsCategoryId[] = ["all", "stem", "arts", "logic", "sports", "music", "kits"];

export function KidsCategoryStrip({ selected, onChange }: KidsCategoryStripProps) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
      {CATEGORY_KEYS.map((key) => {
        const cat = KIDS_CATEGORIES[key];
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition active:scale-95 ${
              isSelected
                ? "border-2 border-slate-900 bg-emerald-300 text-slate-950 shadow-[2px_2px_0_0_#0f172a]"
                : "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="text-sm" aria-hidden="true">{cat.emoji}</span>
            <span>{cat.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
