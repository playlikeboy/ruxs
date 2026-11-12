"use client";

import { useState, useTransition } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Stars } from "./rating-badge";
import { ReplyForm } from "./moderation-buttons";
import { fetchStoreReviewsPage } from "@/features/reviews/actions";
import { ReportReviewButton } from "@/features/support/components/report-button";

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
    return <p className="rounded-2xl bg-app-canvas p-5 text-sm text-muted">No reviews yet. Be the first to rate.</p>;
  }

  const handleLoadMore = () => {
    if (!vendorId || pending) return;
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const res = await fetchStoreReviewsPage(vendorId, nextPage, pageSize);
        setReviews((prev) => [...prev, ...res.reviews]);
        setPage(nextPage);
      } catch {
        toast.error("Could not load more reviews. Please try again.");
      }
    });
  };

  return (
    <div>
      <ul className="divide-y divide-line">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-app-canvas text-sm font-semibold text-ink" aria-hidden="true">
                  {r.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{r.author}</p>
                  <p className="text-xs text-muted">{dateFmt.format(new Date(r.updatedAt))}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <ReportReviewButton reviewId={r.id} vendorId={vendorId} vendorName={storeName} />
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm leading-6 text-ink/80">{r.comment}</p>}
            {r.reply && (
              <div className="mt-2.5 rounded-xl bg-app-canvas px-3.5 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <MessageSquare className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    Reply from {storeName}
                  </p>
                  {r.repliedAt && (
                    <span className="text-xs text-muted">
                      {dateFmt.format(new Date(r.repliedAt))}
                    </span>
                  )}
                </div>
                <p className="mt-1 leading-relaxed text-ink/80">{r.reply}</p>
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
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-line pt-4">
          <p className="text-xs text-muted tabular-nums" aria-live="polite">
            Showing {reviews.length} of {totalCount} reviews
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={handleLoadMore}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink transition-all hover:bg-app-canvas active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? "Loading reviews…" : "Load more reviews"}
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
        </div>
      )}

      {!hasMore && totalCount > pageSize && (
        <p className="mt-5 border-t border-line pt-3 text-center text-xs text-muted">
          All {totalCount} reviews loaded
        </p>
      )}
    </div>
  );
}
