import { Stars } from "./rating-badge";

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  updatedAt: Date;
}

export function ReviewList({ reviews, storeName }: { reviews: ReviewItem[]; storeName: string }) {
  if (reviews.length === 0) {
    return <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500">No reviews yet. Be the first after your delivery.</p>;
  }
  return (
    <ul className="divide-y divide-black/5">
      {reviews.map((r) => (
        <li key={r.id} className="py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-ink" aria-hidden="true">{r.author.charAt(0)}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{r.author}</p>
                <p className="text-xs text-neutral-500">{dateFmt.format(r.updatedAt)}</p>
              </div>
            </div>
            <Stars value={r.rating} />
          </div>
          {r.comment && <p className="mt-2 text-sm leading-6 text-neutral-700">{r.comment}</p>}
          {r.reply && (
            <div className="mt-2 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm">
              <p className="text-xs font-semibold text-ink">Reply from {storeName}</p>
              <p className="mt-0.5 text-neutral-700">{r.reply}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
