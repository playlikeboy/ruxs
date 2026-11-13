import { Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreOrders } from "@/features/store/queries";
import { parseOrderFilter, parsePage, parseSearch } from "@/features/store/schemas";
import type { AdminStoreOrderFilter } from "@/features/store/types";
import { ExportOrdersButton } from "@/features/store/seller-components/csv-tools";
import { FilterPills, hrefWith } from "@/features/store/seller-components/filter-pills";
import { StoreOrdersList } from "@/features/store/seller-components/orders-list";
import { EmptyNote, PAGE, PageHeader, searchInput } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Orders" };

const FILTERS: { v: AdminStoreOrderFilter; t: string }[] = [
  { v: "open", t: "Open" },
  { v: "placed", t: "New" },
  { v: "to_forward", t: "Not forwarded" },
  { v: "packed", t: "Packed" },
  { v: "out_for_delivery", t: "Out for delivery" },
  { v: "awaiting_payment", t: "Awaiting payment" },
  { v: "refund_due", t: "Refund due" },
  { v: "delivered", t: "Delivered" },
  { v: "cancelled", t: "Cancelled" },
  { v: "returned", t: "Returned" },
  { v: "all", t: "All" },
];

export default async function SellerOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const status = parseOrderFilter(sp.status);
  const q = parseSearch(sp.q);
  const page = parsePage(sp.page);
  const list = await getAdminStoreOrders({ status, q, page });
  const base = "/seller-portal/orders";
  const statusLabel = FILTERS.find((f) => f.v === status)?.t ?? "Open";

  return (
    <div className={PAGE}>
      <PageHeader
        title="Orders"
        description="Pack new orders, forward them to a partner, hand them to delivery and settle refunds."
        actions={<ExportOrdersButton status={status} statusLabel={statusLabel} />}
      />

      <form role="search" action={base} className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" type="search" defaultValue={q} placeholder="Order number, name, phone or PIN" aria-label="Search orders" className={searchInput} />
        </div>
        {status !== "open" && <input type="hidden" name="status" value={status} />}
        <button type="submit" className={buttonClass("secondary", "md")}>
          Search
        </button>
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
        <EmptyNote
          title="No orders here"
          body={q ? "Nothing matches that search. Check the order number or try the phone number." : status === "open" ? "Nothing to pack or deliver right now." : "No orders with this status. Try another filter."}
        />
      ) : (
        // Keyed by the result set so ticks never carry over to another page or filter.
        <StoreOrdersList key={`${status}:${q}:${list.page}`} rows={list.rows} partners={list.partners} />
      )}

      <AdminPagination page={list.page} totalPages={list.totalPages} totalItems={list.total} limit={list.pageSize} />
    </div>
  );
}
