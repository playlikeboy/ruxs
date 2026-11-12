import Link from "next/link";
import { Plus, Search, Store, AlertCircle, CheckCircle2, PauseCircle, X } from "lucide-react";
import { getAdminVendorList } from "@/features/admin/queries";
import { AdminVendorsTable } from "@/features/admin/components/admin-vendors-table";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { getCategories } from "@/features/platform/queries";

export const metadata = { title: "Vendors" };

const STATUS_FILTERS = [
  { v: "", label: "All stores", key: "total" as const },
  { v: "active", label: "Active", key: "active" as const },
  { v: "pending", label: "Pending review", key: "pending" as const },
  { v: "suspended", label: "Suspended", key: "suspended" as const },
];

/** Builds a vendor-list URL, keeping only the filters that are set. */
function vendorsHref(filters: { q?: string; status?: string; categoryId?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `/admin/vendors?${qs}` : "/admin/vendors";
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string; page?: string }>;
}) {
  const { q = "", status: rawStatus = "", categoryId = "", page } = await searchParams;
  const status = STATUS_FILTERS.some((s) => s.v === rawStatus) ? rawStatus : "";
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  // Categories come from platform settings, so stores in admin-added categories stay filterable.
  const [{ rows, counts, total, totalPages, limit }, categories] = await Promise.all([
    getAdminVendorList({
      q: q || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      page: currentPage,
      limit: 20,
    }),
    getCategories(),
  ]);
  const categoryFilters = [{ v: "", label: "All categories" }, ...categories.map((c) => ({ v: c.id, label: c.label }))];
  const hasFilters = Boolean(q || status || categoryId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-ink text-xs font-bold text-white" aria-hidden="true">
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
          className="flex h-10 items-center gap-2 rounded-control bg-accent px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-accent/90 sm:text-sm"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New vendor</span>
        </Link>
      </div>

      {/* KPI Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "All stores", count: counts.total, icon: Store, color: "text-ink", href: "/admin/vendors" },
          { label: "Active", count: counts.active, icon: CheckCircle2, color: "text-good", href: "/admin/vendors?status=active" },
          { label: "Pending review", count: counts.pending, icon: AlertCircle, color: "text-warn", href: "/admin/vendors?status=pending" },
          { label: "Suspended", count: counts.suspended, icon: PauseCircle, color: "text-bad", href: "/admin/vendors?status=suspended" },
        ].map((k) => {
          const Icon = k.icon;
          const isActive = k.href === "/admin/vendors" ? !status : k.href.endsWith(`status=${status}`);
          return (
            <Link
              key={k.label}
              href={k.href}
              aria-current={isActive ? "page" : undefined}
              className={
                "rounded-card border p-3.5 transition " +
                (isActive
                  ? "border-ink bg-surface shadow-2xs ring-1 ring-ink/10"
                  : "border-line bg-surface hover:border-ink/30")
              }
            >
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-medium">{k.label}</span>
                <Icon className={`h-4 w-4 ${k.color}`} aria-hidden="true" />
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
              className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-11 text-xs placeholder:text-muted focus:border-ink"
            />
            {q && (
              <Link
                href={vendorsHref({ status, categoryId })}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-control text-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
            {status && <input type="hidden" name="status" value={status} />}
            {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
          </form>

          {/* Status filter tabs */}
          <nav aria-label="Filter by status" className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {STATUS_FILTERS.map((s) => {
              const active = status === s.v;
              return (
                <Link
                  key={s.label}
                  href={vendorsHref({ q, status: s.v, categoryId })}
                  aria-current={active ? "page" : undefined}
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
          </nav>
        </div>

        {/* Category filter pills */}
        <nav aria-labelledby="vendor-category-filter" className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none]">
          <span id="vendor-category-filter" className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Category
          </span>
          {categoryFilters.map((c) => {
            const active = categoryId === c.v;
            return (
              <Link
                key={c.v || "all"}
                href={vendorsHref({ q, status, categoryId: c.v })}
                aria-current={active ? "page" : undefined}
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
        </nav>
      </div>

      {/* Main Vendor Data Table */}
      {rows.length === 0 ? (
        <div className="space-y-3 rounded-card border border-line bg-surface p-12 text-center text-sm text-muted">
          <Store className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
          <p className="font-semibold text-ink">No vendor stores found</p>
          <p className="mx-auto max-w-sm text-xs text-muted">
            {q
              ? <>No stores match &ldquo;{q}&rdquo; with the selected filters.</>
              : hasFilters
                ? "No stores match the selected filters."
                : "Add the first store to start onboarding merchants."}
          </p>
          <Link
            href={hasFilters ? "/admin/vendors" : "/admin/vendors/new"}
            className="inline-flex min-h-10 items-center rounded-control border border-line px-3.5 text-xs font-semibold text-ink transition hover:bg-bg"
          >
            {hasFilters ? "Clear filters" : "Add vendor"}
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
