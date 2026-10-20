import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminBookings } from "@/features/admin/queries";
import { AdminBookingsList } from "@/features/bookings/components/admin-bookings-list";
import { AdminPagination } from "@/features/admin/components/admin-pagination";

export const metadata = { title: "Bookings · Admin" };

const FILTERS = [
  { v: "", t: "All" },
  { v: "confirmed", t: "Upcoming" },
  { v: "held", t: "Awaiting payment" },
  { v: "done", t: "Completed" },
  { v: "no_show", t: "No-show" },
  { v: "cancelled", t: "Cancelled" },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status: raw, q = "", page } = await searchParams;
  const status = FILTERS.some((f) => f.v === raw) ? raw : "";
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const { rows, total, totalPages, limit } = await getAdminBookings({
    status: status || undefined,
    q: q || undefined,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-muted">
            Sessions with trainers, mehndi artists, physiotherapists, and service providers. Read-only audit.
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
            placeholder="Search booking #, provider, customer, service…"
            aria-label="Search bookings"
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
            const href = params.toString() ? `/admin/bookings?${params.toString()}` : "/admin/bookings";

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

      {rows.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-12 text-center text-sm text-muted">
          No bookings match the current criteria.
        </div>
      ) : (
        <AdminBookingsList rows={rows} />
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
