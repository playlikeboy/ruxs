"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { saveMyReview } from "@/features/reviews/actions";

const WORDS = ["", "Poor", "Okay", "Good", "Very good", "Excellent"];

export function ReviewForm({ vendorSlug, initialRating, initialComment }: { vendorSlug: string; initialRating?: number; initialComment?: string | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [pending, startTransition] = useTransition();
  const shown = hover || rating;

  return (
    <form
      className="space-y-3 rounded-2xl border border-black/10 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) {
          toast.error("Tap the stars to rate");
          return;
        }
        startTransition(async () => {
          const res = await saveMyReview({ vendorSlug, rating, comment: comment || undefined });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(initialRating ? "Review updated" : "Thanks for rating!");
            router.refresh();
          }
        });
      }}
    >
      <p className="text-[15px] font-semibold text-ink">{initialRating ? "Your rating" : "Rate this store"}</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            className="p-1 transition active:scale-90"
          >
            <Star className={"h-8 w-8 " + (i <= shown ? "fill-[#E8A33D] text-[#E8A33D]" : "text-neutral-300")} aria-hidden="true" />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-neutral-600">{WORDS[shown]}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="What did you like? Taste, punctuality, packing… (optional)"
        className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none"
      />
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-ink text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : initialRating ? "Update review" : "Post review"}
      </button>
    </form>
  );
}
