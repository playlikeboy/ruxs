import Link from "next/link";
import { Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { getAdminStoreOrders } from "@/features/store/queries";
import { parseOrderFilter, parsePage, parseSearch } from "@/features/store/schemas";
import type { AdminStoreOrderFilter } from "@/features/store/types";
import { FilterPills, hrefWith } from "@/features/store/admin-components/filter-pills";
import { StorePaymentBadge, StoreStatusBadge, istDateTime } from "@/features/store/admin-components/store-labels";

export const metadata = { title: "Store orders" };

const FILTERS: { v: AdminStoreOrderFilter; t: string }[] = [
  { v: "open", t: "Open" },
  { v: "placed", t: "New" },
  { v: "packed", t: "Packed" },
  { v: "out_for_delivery", t: "Out for delivery" },
  { v: "awaiting_payment", t: "Awaiting payment" },
  { v: "refund_due", t: "Refund due" },
  { v: "delivered", t: "Delivered" },
  { v: "cancelled", t: "Cancelled" },
  { v: "returned", t: "Returned" },
  { v: "all", t: "All" },
];

export default async function AdminStoreOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = parseOrderFilter(sp.status);
  const q = parseSearch(sp.q);
  const page = parsePage(sp.page);
  const list = await getAdminStoreOrders({ status, q, page });
  const base = "/admin/store/orders";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-muted">
          <Link href="/admin/store" className="hover:text-ink hover:underline">RUXs Store</Link>
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted">Pack new orders, hand them to delivery, and settle refunds.</p>
      </div>

      <form role="search" action={base} className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Order #, name or phone"
            aria-label="Search orders"
            className="min-h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-base placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
          />
        </div>
        {status !== "open" && <input type="hidden" name="status" value={status} />}
        <button type="submit" className={buttonClass("secondary", "sm")}>Search</button>
      </form>

      <FilterPills
        label="Filter by status"
        current={status}
        items={FILTERS.map((f) => ({
          value: f.v,
          text: f.t,
          count: f.v === "all" ? undefined : list.counts[f.v],
          href: hrefWith(base, { q, status: f.v === "open" ? undefined : f.v }),
        }))}
      />

      {list.rows.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-ink">No orders here</p>
          <p className="mt-1 text-sm text-muted">
            {q ? "Try another search." : status === "open" ? "Nothing to pack or deliver right now." : "Try another filter."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {list.rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`${base}/${r.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 p-3 transition hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tabular-nums text-ink">{r.orderNumber}</span>
                  <span className="block truncate text-xs text-muted">
                    {r.customerName} · {r.phone} · {r.itemCount} {r.itemCount === 1 ? "item" : "items"}
                  </span>
                  <span className="block text-xs text-muted">{istDateTime(r.createdAt)}</span>
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-ink sm:order-last">{formatINR(r.totalPaise)}</span>
                <span className="col-span-2 flex flex-wrap gap-1 sm:col-span-1 sm:justify-end">
                  <StoreStatusBadge status={r.status} />
                  <StorePaymentBadge status={r.paymentStatus} mode={r.paymentMode} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AdminPagination page={list.page} totalPages={list.totalPages} totalItems={list.total} limit={list.pageSize} />
    </div>
  );
}
