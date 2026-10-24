import Link from "next/link";
import { Plus, Search, Store, AlertCircle, CheckCircle2, PauseCircle, X } from "lucide-react";
import { getAdminVendorList } from "@/features/admin/queries";
import { AdminVendorsTable } from "@/features/admin/components/admin-vendors-table";
import { AdminPagination } from "@/features/admin/components/admin-pagination";

export const metadata = { title: "Vendors · Admin" };

const STATUS_FILTERS = [
  { v: "", label: "All Stores", key: "total" as const },
  { v: "active", label: "Active", key: "active" as const },
  { v: "pending", label: "Pending Review", key: "pending" as const },
  { v: "suspended", label: "Suspended", key: "suspended" as const },
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

  const { rows, counts, total, totalPages, limit } = await getAdminVendorList({
    q: q || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-ink text-xs font-bold text-white">
              <Store className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Vendor stores</h1>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Manage store profiles, logins, commission rates, and life cycle operations across all categories.
          </p>
        </div>

        <Link
          href="/admin/vendors/new"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-accent px-4 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New vendor</span>
        </Link>
      </div>

      {/* KPI Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Stores", count: counts.total, icon: Store, color: "text-ink", href: "/admin/vendors" },
          { label: "Active & Live", count: counts.active, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", href: "/admin/vendors?status=active" },
          { label: "Pending Review", count: counts.pending, icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", href: "/admin/vendors?status=pending" },
          { label: "Suspended", count: counts.suspended, icon: PauseCircle, color: "text-rose-600 dark:text-rose-400", href: "/admin/vendors?status=suspended" },
        ].map((k) => {
          const Icon = k.icon;
          const isActive = (k.href === "/admin/vendors" && !status) || (status && k.href.includes(`status=${status}`));
          return (
            <Link
              key={k.label}
              href={k.href}
              className={
                "rounded-[14px] border p-3.5 transition " +
                (isActive
                  ? "border-ink bg-surface shadow-2xs ring-1 ring-ink/10"
                  : "border-line bg-surface hover:border-ink/30")
              }
            >
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-medium">{k.label}</span>
                <Icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${k.color}`}>
                {k.count}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search form */}
          <form className="relative flex-1 min-w-[240px] max-w-md" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search store name, phone, city, login ID…"
              aria-label="Search vendors"
              className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-9 text-xs placeholder:text-muted focus:border-ink focus:outline-none"
            />
            {q && (
              <Link
                href={`/admin/vendors${status ? `?status=${status}` : ""}${categoryId ? `${status ? "&" : "?"}categoryId=${categoryId}` : ""}`}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </Link>
            )}
            {status && <input type="hidden" name="status" value={status} />}
            {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
          </form>

          {/* Status filter tabs */}
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
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
                    (active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink")
                  }
                >
                  {s.label} ({counts[s.key]})
                </Link>
              );
            })}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1 shrink-0">
            Category:
          </span>
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
                    : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink")
                }
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Vendor Data Table */}
      {rows.length === 0 ? (
        <div className="rounded-[16px] border border-line bg-surface p-12 text-center text-sm text-muted space-y-3">
          <Store className="mx-auto h-8 w-8 text-muted/60" />
          <p className="font-semibold text-ink">No vendor stores found</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            No stores match your current search &ldquo;{q}&rdquo; or selected filters.
          </p>
          <Link
            href="/admin/vendors"
            className="inline-block rounded-[10px] border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-bg transition"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <AdminVendorsTable rows={rows} />
      )}

      {/* Pagination */}
      <AdminPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={total}
        limit={limit}
      />
    </div>
  );
}
