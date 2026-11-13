"use client";

import { INDIAN_STATES } from "@/core/store";

/** Checkbox list of states and union territories, in a short scrolling box. */
export function StatePicker({
  legend,
  hint,
  name,
  value,
  onChange,
}: {
  legend: string;
  hint?: string;
  /** Prefix for the checkbox ids, unique on the page. */
  name: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const all = value.length === INDIAN_STATES.length;
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">
        {legend} <span className="font-normal tabular-nums text-muted">({value.length} picked)</span>
      </legend>
      <div className="grid max-h-56 gap-x-4 overflow-y-auto rounded-control border border-line bg-surface p-2 sm:grid-cols-2">
        {INDIAN_STATES.map((s) => {
          const id = `${name}-${s.replace(/[^a-z]/gi, "")}`;
          const on = value.includes(s);
          return (
            <label key={s} htmlFor={id} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[8px] px-2 text-sm text-ink hover:bg-bg">
              <input
                id={id}
                type="checkbox"
                checked={on}
                onChange={() => onChange(on ? value.filter((v) => v !== s) : [...value, s])}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              {s}
            </label>
          );
        })}
      </div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="pt-1 text-xs leading-4 text-muted">{hint}</p>
        <button
          type="button"
          onClick={() => onChange(all ? [] : [...INDIAN_STATES])}
          className="min-h-9 shrink-0 rounded-control px-2 text-xs font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {all ? "Clear all" : "Pick all"}
        </button>
      </div>
    </fieldset>
  );
}

/** "834, 110001 12" → ["834", "110001", "12"]. Validation happens on the server. */
export function parsePinPrefixes(text: string): string[] {
  return [...new Set(text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))];
}
