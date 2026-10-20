import { Search } from "lucide-react";
import { getAdminHouseholds } from "@/features/admin/queries";
import { AdminHouseholdsTable } from "@/features/admin/components/admin-households-table";
import { AdminPagination } from "@/features/admin/components/admin-pagination";

export const metadata = { title: "Households · Admin" };

export default async function AdminHouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const { people, total, totalPages, limit } = await getAdminHouseholds({
    q: q || undefined,
    page: currentPage,
    limit: 25,
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Households</h1>
          <p className="mt-1 text-sm text-muted">
            {total} registered consumers using the RUXs app.
          </p>
        </div>

        <form className="relative flex-1 min-w-[240px] max-w-sm" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email, address…"
            aria-label="Search households"
            className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-xs placeholder:text-muted focus:border-ink focus:outline-none"
          />
        </form>
      </div>

      {people.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-12 text-center text-sm text-muted">
          No households found matching your query.
        </div>
      ) : (
        <AdminHouseholdsTable people={people} />
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
