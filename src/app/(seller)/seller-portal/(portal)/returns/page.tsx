import Link from "next/link";
import { formatINR } from "@/core/money";
import { STORE_RETURN_STATUS_LABELS } from "@/core/store";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreReturns } from "@/features/store/admin-queries";
import { parsePage, parseReturnFilter } from "@/features/store/schemas";
import type { StoreReturnStatus } from "@/features/store/types";
import { FilterPills, hrefWith } from "@/features/store/seller-components/filter-pills";
import { ReturnActions } from "@/features/store/seller-components/return-actions";
import { EmptyNote, PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";
import { ReturnBadge, StorePaymentBadge, istDateTime } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Returns" };

const ORDER: (StoreReturnStatus | "all")[] = ["requested", "approved", "received", "refunded", "rejected", "all"];

export default async function SellerReturnsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const status = parseReturnFilter(sp.status);
  const list = await getAdminStoreReturns({ status, page: parsePage(sp.page) });
  const base = "/seller-portal/returns";

  return (
    <div className={PAGE}>
      <PageHeader
        title="Returns"
        description="A return covers the whole order. Approve it, mark the parcel received, then refund. Declining needs a reason the household can read."
      />

      <FilterPills
        label="Filter returns"
        current={status}
        items={ORDER.map((s) => ({
          value: s,
          text: s === "all" ? "All" : s === "requested" ? "New requests" : STORE_RETURN_STATUS_LABELS[s],
          count: list.counts[s],
          href: hrefWith(base, { status: s === "requested" ? undefined : s }),
        }))}
      />

      {list.rows.length === 0 ? (
        <EmptyNote title={status === "requested" ? "No new return requests" : "No returns here"} body={status === "requested" ? "When a household asks to return a delivered order, it shows up here." : "Try another filter."} />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {list.rows.map((r) => (
            <li key={r.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/seller-portal/orders/${r.orderId}`} className="text-sm font-semibold tabular-nums text-ink hover:text-accent hover:underline">
                  {r.orderNumber}
                </Link>
                <ReturnBadge status={r.status} />
                <StorePaymentBadge status={r.paymentStatus} mode={r.paymentMode} />
                <span className="ml-auto text-sm font-semibold tabular-nums text-ink">{formatINR(r.totalPaise)}</span>
              </div>
              <p className="text-xs text-muted">
                {r.customerName} ·{" "}
                <a href={`tel:${r.phone}`} className="tabular-nums text-accent hover:underline">
                  {r.phone}
                </a>{" "}
                · asked {istDateTime(r.createdAt)}
              </p>
              <p className="max-w-[70ch] break-words text-sm text-ink">
                <span className="font-semibold">Reason:</span> {r.reason}
              </p>
              {r.adminNote && (
                <p className="max-w-[70ch] break-words text-sm text-muted">
                  <span className="font-semibold text-ink">Our note:</span> {r.adminNote}
                </p>
              )}
              <ReturnActions ret={r} />
            </li>
          ))}
        </ul>
      )}

      <AdminPagination page={list.page} totalPages={list.totalPages} totalItems={list.total} limit={list.pageSize} />
    </div>
  );
}
