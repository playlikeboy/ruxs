import Link from "next/link";
import { Star } from "lucide-react";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreReviews } from "@/features/store/admin-queries";
import { parsePage, parseReviewFilter } from "@/features/store/schemas";
import type { StoreReviewStatus } from "@/features/store/types";
import { FilterPills, hrefWith } from "@/features/store/seller-components/filter-pills";
import { ReviewActions } from "@/features/store/seller-components/review-actions";
import { EmptyNote, PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";
import { ReviewBadge, istDateTime } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Reviews" };

const FILTERS: { v: StoreReviewStatus | "all"; t: string }[] = [
  { v: "pending", t: "Waiting" },
  { v: "published", t: "Published" },
  { v: "hidden", t: "Hidden" },
  { v: "all", t: "All" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={"h-4 w-4 " + (n <= rating ? "fill-warn text-warn" : "text-line")} aria-hidden="true" />
      ))}
    </span>
  );
}

export default async function SellerReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const status = parseReviewFilter(sp.status);
  const list = await getAdminStoreReviews({ status, page: parsePage(sp.page) });
  const base = "/seller-portal/reviews";

  return (
    <div className={PAGE}>
      <PageHeader
        title="Reviews"
        description="A new or edited review waits here until you publish it. Only households who received the product can review it."
      />

      <FilterPills
        label="Filter reviews"
        current={status}
        items={FILTERS.map((f) => ({ value: f.v, text: f.t, count: list.counts[f.v], href: hrefWith(base, { status: f.v === "pending" ? undefined : f.v }) }))}
      />

      {list.rows.length === 0 ? (
        <EmptyNote title={status === "pending" ? "No reviews waiting" : "No reviews here"} body={status === "pending" ? "New reviews show up here for a check before households see them." : "Try another filter."} />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {list.rows.map((r) => (
            <li key={r.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={r.rating} />
                <ReviewBadge status={r.status} />
                <span className="text-xs tabular-nums text-muted">{istDateTime(r.createdAt)}</span>
              </div>
              <div className="max-w-[70ch]">
                {r.title && <p className="break-words text-sm font-semibold text-ink">{r.title}</p>}
                {r.body ? <p className="whitespace-pre-line break-words text-sm text-ink">{r.body}</p> : !r.title && <p className="text-sm text-muted">Rating only, no words.</p>}
              </div>
              <p className="text-xs text-muted">
                {r.customerName ?? "A household"} on{" "}
                <Link href={`/seller-portal/products/${r.productId}`} className="font-semibold text-accent hover:underline">
                  {r.productName}
                </Link>
                {r.orderNumber && (
                  <>
                    {" · order "}
                    <Link href={`/seller-portal/orders/${r.orderId}`} className="font-semibold tabular-nums text-accent hover:underline">
                      {r.orderNumber}
                    </Link>
                  </>
                )}
              </p>
              <ReviewActions reviewId={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}

      <AdminPagination page={list.page} totalPages={list.totalPages} totalItems={list.total} limit={list.pageSize} />
    </div>
  );
}
