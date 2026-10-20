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

  if (initialRating) {
    return (
      <div className="rounded-2xl border border-black/10 bg-neutral-50/70 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold text-ink">Your Rating</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            ✓ Rated
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={"h-5 w-5 " + (i <= initialRating ? "fill-[#E8A33D] text-[#E8A33D]" : "text-neutral-300")}
              aria-hidden="true"
            />
          ))}
          <span className="ml-2 text-sm font-semibold text-ink">{WORDS[initialRating]}</span>
        </div>
        {initialComment && (
          <p className="mt-2 text-sm text-neutral-700 italic leading-relaxed">
            &ldquo;{initialComment}&rdquo;
          </p>
        )}
        <p className="mt-3 text-[11px] text-neutral-400">
          Each customer can rate a store once. Thank you for your feedback!
        </p>
      </div>
    );
  }

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
            toast.success("Thanks for rating!");
            router.refresh();
          }
        });
      }}
    >
      <p className="text-[15px] font-semibold text-ink">Rate this store</p>
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
