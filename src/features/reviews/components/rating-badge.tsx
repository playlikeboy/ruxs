import { Star } from "lucide-react";
import type { RatingSummary } from "@/core/ratings";

export function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={size + (i <= Math.round(value) ? " fill-[#E8A33D] text-[#E8A33D]" : " text-line")} aria-hidden="true" />
      ))}
    </span>
  );
}

/** "★ 4.6 (23)" or "New" when a store has no ratings yet. */
export function RatingBadge({ rating, className = "" }: { rating: RatingSummary; className?: string }) {
  if (rating.average == null) {
    return <span className={"inline-flex items-center rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-good " + className}>New</span>;
  }
  return (
    <span className={"inline-flex items-center gap-1 text-sm font-semibold text-ink " + className}>
      <Star className="h-3.5 w-3.5 fill-[#E8A33D] text-[#E8A33D]" aria-hidden="true" />
      <span className="tabular-nums">{rating.average.toFixed(1)}</span>
      <span className="font-normal text-neutral-500 tabular-nums">({rating.count})</span>
      <span className="sr-only">average rating from {rating.count} reviews</span>
    </span>
  );
}
