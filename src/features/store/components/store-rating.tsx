import { Star } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { StoreRating } from "@/features/store/types";

/** Five stars filled to the nearest whole star. Decorative: pair it with the number or an sr-only label. */
export function StoreStars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("h-4 w-4", n <= filled ? "fill-kids-sunny text-warn" : "text-kids-ink/25", className)} />
      ))}
    </span>
  );
}

/** Compact rating for cards and headers: one star, the average and the count. Renders nothing without reviews. */
export function StoreRatingLine({ rating, className }: { rating: StoreRating; className?: string }) {
  if (rating.count <= 0 || rating.average == null) return null;
  return (
    <p className={cn("flex items-center gap-1 text-xs text-kids-ink/70", className)}>
      <Star className="h-3.5 w-3.5 fill-kids-sunny text-warn" aria-hidden="true" />
      <span className="font-bold tabular-nums text-kids-ink">{rating.average.toFixed(1)}</span>
      <span className="sr-only">out of 5 from</span>
      <span className="tabular-nums" aria-hidden="true">
        ({rating.count})
      </span>
      <span className="sr-only">
        {rating.count} {rating.count === 1 ? "review" : "reviews"}
      </span>
    </p>
  );
}
