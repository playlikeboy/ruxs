"use client";

interface QtyStepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export function QtyStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: QtyStepperProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#FAFAF7] border border-line rounded-[10px]">
      <span className="text-xs font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center bg-surface border border-line rounded-[8px] text-ink font-semibold disabled:opacity-40 hover:bg-white active:scale-95 transition-all"
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 flex items-center justify-center bg-surface border border-line rounded-[8px] text-ink font-semibold disabled:opacity-40 hover:bg-white active:scale-95 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}
