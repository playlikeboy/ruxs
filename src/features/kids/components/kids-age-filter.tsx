"use client";

import { AppIcon } from "@/components/ui/app-icon";

import { KIDS_AGE_BRACKETS, type KidsAgeBracketId } from "@/core/kids";

interface KidsAgeFilterProps {
  selected: KidsAgeBracketId;
  onChange: (age: KidsAgeBracketId) => void;
}

export function KidsAgeFilter({ selected, onChange }: KidsAgeFilterProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-kids-ink/60">Filter by Age Group</span>
      </div>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {KIDS_AGE_BRACKETS.map((bracket) => {
          const isSelected = selected === bracket.id;
          return (
            <button
              key={bracket.id}
              type="button"
              onClick={() => onChange(bracket.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition active:scale-95 ${
                isSelected
                  ? "border-2 border-kids-grape/15 bg-sky-300 text-kids-ink shadow-[0_3px_0_rgba(155,92,246,0.18)]"
                  : "border-2 border-slate-200 bg-white text-kids-ink/70 hover:border-slate-300"
              }`}
            >
              <AppIcon name={bracket.id} className="h-4 w-4" />
              <span>{bracket.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
