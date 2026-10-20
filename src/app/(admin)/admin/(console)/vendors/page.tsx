import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getAdminVendorList } from "@/features/admin/queries";
import { AdminVendorsTable } from "@/features/admin/components/admin-vendors-table";
import { AdminPagination } from "@/features/admin/components/admin-pagination";

export const metadata = { title: "Vendors · Admin" };

const STATUS_FILTERS = [
  { v: "", label: "All" },
  { v: "active", label: "Active" },
  { v: "pending", label: "Pending Review" },
  { v: "suspended", label: "Suspended" },
];

const CATEGORY_FILTERS = [
  { v: "", label: "All Categories" },
  { v: "tiffin", label: "🍱 Tiffin" },
  { v: "water", label: "💧 Water" },
  { v: "milk", label: "🥛 Milk" },
  { v: "fitness", label: "🏋️ Fitness" },
  { v: "physio", label: "🩺 Physio" },
  { v: "mehndi", label: "🌿 Mehndi" },
  { v: "kids", label: "🚀 Kids" },
  { v: "gifts", label: "🎁 Gifts" },
];

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string; page?: string }>;
}) {
  const { q = "", status = "", categoryId = "", page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const { rows, total, totalPages, limit } = await getAdminVendorList({
    q: q || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Vendor stores</h1>
          <p className="mt-1 text-sm text-muted">
            {total} stores registered. Manage vendor logins, commission rates, catalog, and operations.
          </p>
        </div>
        <Link
          href="/admin/vendors/new"
          className="flex h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-bold text-white shadow-2xs transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New vendor</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <form className="relative flex-1 min-w-[240px] max-w-sm" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, city, login ID…"
            aria-label="Search vendors"
            className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-xs placeholder:text-muted focus:border-ink focus:outline-none"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {STATUS_FILTERS.map((s) => {
              const active = status === s.v;
              const params = new URLSearchParams();
              if (s.v) params.set("status", s.v);
              if (categoryId) params.set("categoryId", categoryId);
              if (q) params.set("q", q);
              return (
                <Link
                  key={s.label}
                  href={`/admin/vendors?${params.toString()}`}
                  className={
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition " +
                    (active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-surface text-muted hover:border-ink/40")
                  }
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {CATEGORY_FILTERS.map((c) => {
              const active = categoryId === c.v;
              const params = new URLSearchParams();
              if (c.v) params.set("categoryId", c.v);
              if (status) params.set("status", status);
              if (q) params.set("q", q);
              return (
                <Link
                  key={c.label}
                  href={`/admin/vendors?${params.toString()}`}
                  className={
                    "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition " +
                    (active
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-muted hover:border-ink/40")
                  }
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-12 text-center text-sm text-muted">
          No vendor stores found matching your filters.
        </div>
      ) : (
        <AdminVendorsTable rows={rows} />
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
