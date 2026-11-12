import Link from "next/link";
import { ImageOff, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { getAdminStoreProducts } from "@/features/store/queries";
import { parsePage, parseProductFilter, parseSearch } from "@/features/store/schemas";
import type { AdminStoreProductFilter } from "@/features/store/types";
import { FilterPills, hrefWith } from "@/features/store/admin-components/filter-pills";
import { StockBadge } from "@/features/store/admin-components/store-labels";

export const metadata = { title: "Store products" };

const FILTERS: { v: AdminStoreProductFilter; t: string }[] = [
  { v: "all", t: "All" },
  { v: "active", t: "Live" },
  { v: "inactive", t: "Hidden" },
  { v: "low", t: "Low stock" },
  { v: "out", t: "Out of stock" },
  { v: "archived", t: "Archived" },
];

export default async function AdminStoreProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = parseSearch(sp.q);
  const filter = parseProductFilter(sp.filter);
  const page = parsePage(sp.page);
  const rawCat = parseSearch(sp.category);

  const list = await getAdminStoreProducts({ q, filter, category: rawCat || null, page });
  const category = list.categories.some((c) => c.id === rawCat) ? rawCat : "";
  const base = "/admin/store/products";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted">
            <Link href="/admin/store" className="hover:text-ink hover:underline">RUXs Store</Link>
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted">Archive a product to take it down. Orders keep their copy.</p>
        </div>
        <ButtonLink href={`${base}/new`} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" /> New product
        </ButtonLink>
      </div>

      <form role="search" className="flex flex-wrap items-center gap-2" action={base}>
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Name, SKU or brand"
            aria-label="Search products"
            className="min-h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-base placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          aria-label="Category"
          className="min-h-10 max-w-[14rem] rounded-control border border-line bg-surface px-3 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
        >
          <option value="">All categories</option>
          {list.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <button type="submit" className={buttonClass("secondary", "sm")}>Apply</button>
      </form>

      <FilterPills
        label="Filter products"
        current={filter}
        items={FILTERS.map((f) => ({
          value: f.v,
          text: f.t,
          count: list.counts[f.v],
          href: hrefWith(base, { q, category, filter: f.v === "all" ? undefined : f.v }),
        }))}
      />

      {list.rows.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-ink">No products here</p>
          <p className="mt-1 text-sm text-muted">
            {q || category || filter !== "all" ? "Try another search or filter." : "Add the first product to start selling."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {list.rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`${base}/${p.id}`}
                className="flex items-center gap-3 p-3 transition hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin uploads from any host
                  <img src={p.image} alt="" className="h-14 w-14 shrink-0 rounded-[10px] border border-line object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-app-canvas text-muted" aria-hidden="true">
                    <ImageOff className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {p.sku} · {p.categoryName}
                    {p.brand ? ` · ${p.brand}` : ""}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {p.archivedAt ? (
                      <Badge tone="neutral">Archived</Badge>
                    ) : p.isActive ? (
                      <Badge tone="good">Live</Badge>
                    ) : (
                      <Badge tone="warn">Hidden</Badge>
                    )}
                    {p.isFeatured && <Badge tone="accent">Featured</Badge>}
                    <StockBadge kind={p.stockKind} stock={p.stock} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-ink">{formatINR(p.pricePaise)}</span>
                  {p.mrpPaise != null && p.mrpPaise > p.pricePaise && (
                    <span className="block text-xs tabular-nums text-muted line-through">{formatINR(p.mrpPaise)}</span>
                  )}
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
