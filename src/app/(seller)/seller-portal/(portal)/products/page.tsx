import Link from "next/link";
import { FileUp, ImageOff, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { formatINR } from "@/core/money";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreProducts } from "@/features/store/queries";
import { parsePage, parseProductFilter, parseSearch } from "@/features/store/schemas";
import type { AdminStoreProductFilter } from "@/features/store/types";
import { ExportProductsButton } from "@/features/store/seller-components/csv-tools";
import { FilterPills, hrefWith } from "@/features/store/seller-components/filter-pills";
import { EmptyNote, PAGE, PageHeader, rowLink, searchInput, selectInput } from "@/features/store/seller-components/seller-ui";
import { ProductStateBadge, StockBadge } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Products" };

const FILTERS: { v: AdminStoreProductFilter; t: string }[] = [
  { v: "all", t: "All" },
  { v: "active", t: "Live" },
  { v: "inactive", t: "Hidden" },
  { v: "low", t: "Low stock" },
  { v: "out", t: "Out of stock" },
  { v: "archived", t: "Archived" },
];

export default async function SellerProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const q = parseSearch(sp.q);
  const filter = parseProductFilter(sp.filter);
  const page = parsePage(sp.page);
  const rawCat = parseSearch(sp.category);

  const list = await getAdminStoreProducts({ q, filter, category: rawCat || null, page });
  const category = list.categories.some((c) => c.id === rawCat) ? rawCat : "";
  const base = "/seller-portal/products";
  const narrowed = Boolean(q || category || filter !== "all");

  return (
    <div className={PAGE}>
      <PageHeader
        title="Products"
        description="Archive a product to take it down. Orders keep their own copy of the name and price."
        actions={
          <>
            <ExportProductsButton />
            <ButtonLink href={`${base}/import`} variant="secondary" size="sm">
              <FileUp className="h-4 w-4" aria-hidden="true" /> Import and bulk stock
            </ButtonLink>
            <ButtonLink href={`${base}/new`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" /> New product
            </ButtonLink>
          </>
        }
      />

      <form role="search" className="flex flex-wrap items-center gap-2" action={base}>
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" type="search" defaultValue={q} placeholder="Name, SKU or brand" aria-label="Search products" className={searchInput} />
        </div>
        <select name="category" defaultValue={category} aria-label="Category" className={selectInput}>
          <option value="">All categories</option>
          {list.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <button type="submit" className={buttonClass("secondary", "md")}>
          Apply
        </button>
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
        <EmptyNote
          title="No products here"
          body={narrowed ? "Nothing matches. Try another search or filter." : "Add the first product, or import a spreadsheet of them."}
          action={
            narrowed ? undefined : (
              <ButtonLink href={`${base}/new`} size="sm">
                <Plus className="h-4 w-4" aria-hidden="true" /> New product
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {list.rows.map((p) => (
            <li key={p.id}>
              <Link href={`${base}/${p.id}`} className={`flex items-center gap-3 p-3 ${rowLink}`}>
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
                    <ProductStateBadge isActive={p.isActive} archivedAt={p.archivedAt} />
                    {p.isFeatured && <Badge tone="accent">Featured</Badge>}
                    <StockBadge kind={p.stockKind} stock={p.stock} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-ink">{formatINR(p.pricePaise)}</span>
                  {p.mrpPaise != null && p.mrpPaise > p.pricePaise && <span className="block text-xs tabular-nums text-muted line-through">{formatINR(p.mrpPaise)}</span>}
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
