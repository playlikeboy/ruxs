"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";
import { submitStoreReview } from "@/features/store/actions";
import type { MyStoreProductState, StoreReviewStatus } from "@/features/store/types";
import { kidsPrimaryButton, kidsSecondaryButton } from "@/features/kids/components/kids-ui";
import { StoreStars } from "./store-rating";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const STATUS: Record<StoreReviewStatus, { label: string; tone: string; text: string }> = {
  pending: { label: "Waiting for approval", tone: "bg-kids-sunny/60 text-warn", text: "RUXs checks each review before it shows here." },
  published: { label: "Published", tone: "bg-kids-mint/70 text-good", text: "Your review is shown on this page." },
  hidden: { label: "Not shown", tone: "bg-kids-ink/[0.06] text-kids-ink/75", text: "This review is not shown on the page. You can edit and send it again." },
};

const FIELD =
  "mt-1 w-full rounded-[12px] border border-kids-ink/20 bg-white px-3.5 text-base text-kids-ink placeholder:text-kids-ink/55 focus:outline-none focus-visible:border-kids-ink focus-visible:ring-2 focus-visible:ring-kids-ink/20";

/**
 * "Write a review" for a household that has a delivered order with this
 * product, and "your review" (with its moderation status) once sent.
 */
export function ReviewForm({ productId, canReview, myReview }: { productId: string; canReview: boolean; myReview: MyStoreProductState["myReview"] }) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canReview && !myReview) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Pick a star rating");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitStoreReview({ productId, rating, title: title.trim(), body: body.trim() });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setOpen(false);
        toast.success(res.status === "published" ? "Review published" : "Thanks. Your review shows here once RUXs has checked it.");
        router.refresh();
      } catch {
        setError("Could not send your review. Check your connection and try again.");
      }
    });
  }

  if (!open) {
    if (myReview) {
      const s = STATUS[myReview.status];
      return (
        <div className="rounded-[12px] bg-kids-cream p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Your review</p>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", s.tone)}>{s.label}</span>
          </div>
          <p className="mt-1.5 flex items-center gap-2">
            <StoreStars value={myReview.rating} />
            <span className="sr-only">{myReview.rating} out of 5</span>
            {myReview.title && <span className="min-w-0 truncate text-sm font-semibold">{myReview.title}</span>}
          </p>
          {myReview.body && <p className="mt-1 whitespace-pre-line text-sm text-kids-ink/80">{myReview.body}</p>}
          <p className="mt-2 text-xs text-kids-ink/70">{s.text}</p>
          <button type="button" onClick={() => setOpen(true)} className={`${kidsSecondaryButton} mt-3`}>
            <PenLine className="h-4 w-4" aria-hidden="true" /> Edit review
          </button>
        </div>
      );
    }
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${kidsSecondaryButton} w-full`}>
        <PenLine className="h-4 w-4" aria-hidden="true" /> Write a review
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[12px] bg-kids-cream p-3" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold">Your rating</legend>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-kids-ink"
            >
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setError(null);
                }}
                className="sr-only"
              />
              <Star className={cn("h-7 w-7 transition-colors", n <= rating ? "fill-kids-sunny text-warn" : "text-kids-ink/30")} aria-hidden="true" />
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"}, {RATING_WORDS[n]}
              </span>
            </label>
          ))}
          <span className="ml-1 text-sm font-medium text-kids-ink/75" aria-hidden="true">
            {RATING_WORDS[rating]}
          </span>
        </div>
      </fieldset>

      <label htmlFor={`${id}-title`} className="mt-3 block text-sm font-semibold">
        Headline <span className="font-normal text-kids-ink/65">(optional)</span>
      </label>
      <input id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={cn(FIELD, "h-12")} />

      <label htmlFor={`${id}-body`} className="mt-3 block text-sm font-semibold">
        Your review <span className="font-normal text-kids-ink/65">(optional)</span>
      </label>
      <textarea
        id={`${id}-body`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1500}
        rows={4}
        placeholder="What did your child make of it?"
        className={cn(FIELD, "py-2.5 leading-relaxed")}
      />

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-bad">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-kids-ink/70">Your first name is shown with the review. RUXs checks each review before it appears.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className={`${kidsSecondaryButton} flex-1`}>
          Cancel
        </button>
        <button type="submit" disabled={pending} aria-busy={pending} className={`${kidsPrimaryButton} flex-1 disabled:opacity-60`}>
          {pending ? "Sending…" : myReview ? "Update review" : "Send review"}
        </button>
      </div>
    </form>
  );
}
