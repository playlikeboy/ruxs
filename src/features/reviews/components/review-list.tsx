"use client";

import { useState, useTransition } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Stars } from "./rating-badge";
import { ReplyForm } from "./moderation-buttons";
import { fetchStoreReviewsPage } from "@/features/reviews/actions";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  repliedAt?: Date | string | null;
  updatedAt: Date | string;
}

export function ReviewList({
  reviews: initialReviews,
  storeName,
  vendorId,
  vendorSlug,
  total,
  canReply = false,
  pageSize = 10,
}: {
  reviews: ReviewItem[];
  storeName: string;
  vendorId?: string;
  vendorSlug?: string;
  total?: number;
  canReply?: boolean;
  pageSize?: number;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const totalCount = total ?? initialReviews.length;
  const hasMore = vendorId != null && reviews.length < totalCount;

  if (reviews.length === 0) {
    return <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500">No reviews yet. Be the first to rate.</p>;
  }

  const handleLoadMore = () => {
    if (!vendorId || pending) return;
    const nextPage = page + 1;
    startTransition(async () => {
      const res = await fetchStoreReviewsPage(vendorId, nextPage, pageSize);
      setReviews((prev) => [...prev, ...res.reviews]);
      setPage(nextPage);
    });
  };

  return (
    <div>
      <ul className="divide-y divide-black/5">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-ink" aria-hidden="true">
                  {r.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{r.author}</p>
                  <p className="text-xs text-neutral-500">{dateFmt.format(new Date(r.updatedAt))}</p>
                </div>
              </div>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm leading-6 text-neutral-700">{r.comment}</p>}
            {r.reply && (
              <div className="mt-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <MessageSquare className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    Reply from {storeName}
                  </p>
                  {r.repliedAt && (
                    <span className="text-[11px] text-neutral-400">
                      {dateFmt.format(new Date(r.repliedAt))}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-neutral-700 leading-relaxed">{r.reply}</p>
              </div>
            )}
            {canReply && vendorSlug && (
              <div className="mt-2">
                <ReplyForm
                  slug={vendorSlug}
                  reviewId={r.id}
                  initial={r.reply}
                  onSuccess={(newReply) => {
                    setReviews((prev) =>
                      prev.map((item) =>
                        item.id === r.id
                          ? { ...item, reply: newReply, repliedAt: newReply ? new Date() : null }
                          : item
                      )
                    );
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-black/5 pt-4">
          <p className="text-xs text-neutral-500 tabular-nums">
            Showing {reviews.length} of {totalCount} reviews
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={handleLoadMore}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-ink shadow-xs hover:bg-neutral-50 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {pending ? "Loading reviews…" : "Load more reviews"}
            <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          </button>
        </div>
      )}

      {!hasMore && totalCount > pageSize && (
        <p className="mt-5 border-t border-black/5 pt-3 text-center text-xs text-neutral-400">
          All {totalCount} reviews loaded
        </p>
      )}
    </div>
  );
}
