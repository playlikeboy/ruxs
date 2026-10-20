import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminShopOrders } from "@/features/shop-orders/queries";
import { AdminOrdersList } from "@/features/shop-orders/components/admin-orders-list";
import { AdminPagination } from "@/features/admin/components/admin-pagination";

export const metadata = { title: "Orders · Admin" };

const FILTERS = [
  { v: "", t: "All" },
  { v: "awaiting_payment", t: "Unpaid" },
  { v: "placed", t: "New" },
  { v: "accepted", t: "Preparing" },
  { v: "out_for_delivery", t: "On the way" },
  { v: "delivered", t: "Delivered" },
  { v: "cancelled", t: "Cancelled" },
  { v: "rejected", t: "Declined" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status: raw, q = "", page } = await searchParams;
  const status = FILTERS.some((f) => f.v === raw) ? raw : "";
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const { orders, total, totalPages, limit } = await getAdminShopOrders({
    status: status || undefined,
    q: q || undefined,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">All app orders</h1>
          <p className="mt-1 text-sm text-muted">
            Read-only audit of every app order. Stores accept and deliver from their own panel; refunds are on Payouts.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <form className="relative flex-1 min-w-[240px] max-w-sm" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order #, customer, store, address…"
            aria-label="Search orders"
            className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-xs placeholder:text-muted focus:border-ink focus:outline-none"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const params = new URLSearchParams();
            if (f.v) params.set("status", f.v);
            if (q) params.set("q", q);
            const href = params.toString() ? `/admin/orders?${params.toString()}` : "/admin/orders";

            return (
              <Link
                key={f.t}
                href={href}
                className={
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition " +
                  (status === f.v
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface text-muted hover:border-ink/40")
                }
              >
                {f.t}
              </Link>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-12 text-center text-sm text-muted">
          No orders match the current criteria.
        </div>
      ) : (
        <AdminOrdersList orders={orders} />
      )}

      <AdminPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={total}
        limit={limit}
      />
    </div>
  );
}
