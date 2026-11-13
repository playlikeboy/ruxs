import Link from "next/link";
import { Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { requireSeller } from "@/features/store/seller-auth";
import { parsePage, parseSearch } from "@/features/store/schemas";
import { getSellerCustomers } from "@/features/store/seller-queries";
import { EmptyNote, PAGE, PageHeader, searchInput } from "@/features/store/seller-components/seller-ui";
import { istDate } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Customers" };

export default async function SellerCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const q = parseSearch(sp.q);
  const list = await getSellerCustomers({ q, page: parsePage(sp.page) });
  const base = "/seller-portal/customers";

  return (
    <div className={PAGE}>
      <PageHeader
        title="Customers"
        description="Households that have ordered from the store, biggest spender first. Name, phone and city come from their latest order; nothing else is kept here."
      />

      <form role="search" action={base} className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" type="search" defaultValue={q} placeholder="Name or phone" aria-label="Search customers" className={searchInput} />
        </div>
        <button type="submit" className={buttonClass("secondary", "md")}>
          Search
        </button>
      </form>

      {list.rows.length === 0 ? (
        <EmptyNote title={q ? "No customer matches" : "No customers yet"} body={q ? "Check the spelling, or search by phone number." : "A household appears here after its first store order."} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Store customers with order count and total spent</caption>
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Customer</th>
                <th scope="col" className="px-2 py-2.5 font-semibold">City</th>
                <th scope="col" className="px-2 py-2.5 text-right font-semibold">Orders</th>
                <th scope="col" className="px-2 py-2.5 text-right font-semibold">Spent</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.rows.map((c) => (
                <tr key={c.userId}>
                  <th scope="row" className="max-w-[16rem] px-4 py-2.5 font-normal">
                    <Link href={`/seller-portal/orders?status=all&q=${encodeURIComponent(c.phone)}`} className="block truncate font-medium text-ink hover:text-accent hover:underline">
                      {c.name || "No name"}
                    </Link>
                    <a href={`tel:${c.phone}`} className="text-xs tabular-nums text-muted hover:text-accent hover:underline">
                      {c.phone}
                    </a>
                  </th>
                  <td className="px-2 py-2.5 text-ink">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-ink">
                    {c.orders}
                    {c.allOrders > c.orders && <span className="block text-xs text-muted">{c.allOrders} placed</span>}
                  </td>
                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-ink">{formatINR(c.spentPaise)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs tabular-nums text-muted">{istDate(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.rows.length > 0 && (
        <p className="text-xs text-muted">Orders and Spent count booked orders only: placed, packed, out for delivery or delivered. Cancelled, returned and unpaid orders are left out.</p>
      )}

      <AdminPagination page={list.page} totalPages={list.totalPages} totalItems={list.total} limit={list.pageSize} />
    </div>
  );
}
