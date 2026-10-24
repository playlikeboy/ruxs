"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/components/ui/cn";

type Choice = "deliver" | "skip" | "extra";

const OPTIONS: { id: Choice; label: string; icon: typeof Check }[] = [
  { id: "deliver", label: "Deliver", icon: Check },
  { id: "skip", label: "Skip", icon: Minus },
  { id: "extra", label: "Extra", icon: Plus },
];

const RESULT: Record<Choice, string> = {
  deliver: "One lunch tomorrow, as usual.",
  skip: "Tomorrow is skipped. The kitchen cooks one less and you are not charged.",
  extra: "Two lunches tomorrow. The extra one goes on your bill.",
};

/** A working example of tomorrow's choice, the same three actions as the household link. */
export function SkipDemo() {
  const [choice, setChoice] = useState<Choice>("deliver");

  return (
    <div className="w-full max-w-[400px] rounded-[16px] border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-lg font-semibold text-ink">Tomorrow&apos;s lunch</p>
        <p className="whitespace-nowrap text-sm tabular-nums text-muted">Change until 10:00 AM</p>
      </div>
      <p className="mt-1 text-sm text-muted">Tiffin plan · your home kitchen</p>

      <div role="radiogroup" aria-label="Tomorrow's lunch" className="mt-5 grid grid-cols-3 gap-2">
        {OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = choice === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setChoice(id)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 rounded-[12px] border text-base font-semibold transition-colors duration-150",
                active ? "border-ink bg-ink text-bg" : "border-line bg-bg text-ink hover:border-ink/40"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-4 min-h-12 text-[15px] leading-snug text-ink">
        {RESULT[choice]}
      </p>
      <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Example. Each store sets its own cutoff and prices.</p>
    </div>
  );
}
