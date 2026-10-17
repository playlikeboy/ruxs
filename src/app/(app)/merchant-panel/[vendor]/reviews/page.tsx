import { summarizeRatings } from "@/core/ratings";
import { getVendorPanelReviews } from "@/features/reviews/queries";
import { Stars } from "@/features/reviews/components/rating-badge";
import { ReplyForm } from "@/features/reviews/components/moderation-buttons";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Reviews" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

export default async function ReviewsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const reviews = await getVendorPanelReviews(slug);
  const visible = reviews.filter((r) => !r.isHidden);
  const summary = summarizeRatings(visible.map((r) => r.rating));
  const histogram = [5, 4, 3, 2, 1].map((star) => ({ star, n: visible.filter((r) => r.rating === star).length }));

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reviews</h1>
        <p className="mt-0.5 text-sm text-muted">What households say about your store. Replies are public.</p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-line bg-surface p-6 shadow-xs sm:grid-cols-[200px_1fr]">
        <div>
          <p className="font-mono text-5xl font-bold tabular-nums text-ink">{summary.average?.toFixed(1) ?? "–"}</p>
          <div className="mt-1"><Stars value={summary.average ?? 0} size="h-4 w-4" /></div>
          <p className="mt-1 text-sm text-muted">{summary.count} {summary.count === 1 ? "review" : "reviews"}</p>
        </div>
        <ul className="space-y-2">
          {histogram.map((h) => (
            <li key={h.star} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-right tabular-nums text-muted">{h.star}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                <span className="block h-full rounded-full bg-[#E8A33D]" style={{ width: summary.count ? `${(h.n / summary.count) * 100}%` : "0%" }} />
              </span>
              <span className="w-8 tabular-nums text-muted">{h.n}</span>
            </li>
          ))}
        </ul>
      </section>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Households can rate you after their first delivery. Great food on time is the best way to get 5 stars." />
      ) : (
        <ul className="grid items-start gap-4 lg:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className={"rounded-2xl border border-line bg-surface p-5 shadow-xs transition hover:shadow-sm " + (r.isHidden ? "opacity-60" : "")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{r.author}</p>
                  <p className="text-xs text-muted">{dateFmt.format(r.updatedAt)}{r.isHidden ? " · hidden by RUXs" : ""}</p>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm leading-6 text-ink">{r.comment}</p>}
              {r.reply && (
                <p className="mt-2 rounded-[10px] bg-bg px-3 py-2 text-sm text-muted"><span className="font-semibold text-ink">Your reply: </span>{r.reply}</p>
              )}
              <div className="mt-2"><ReplyForm slug={slug} reviewId={r.id} initial={r.reply} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
