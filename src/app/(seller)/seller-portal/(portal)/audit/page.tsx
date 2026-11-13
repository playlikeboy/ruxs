import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreAudit } from "@/features/store/admin-queries";
import { parsePage, parseSearch } from "@/features/store/schemas";
import { AuditList } from "@/features/store/seller-components/audit-list";
import { FilterPills, hrefWith } from "@/features/store/seller-components/filter-pills";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Audit log" };

const ENTITIES: { v: string; t: string }[] = [
  { v: "", t: "Everything" },
  { v: "order", t: "Orders" },
  { v: "product", t: "Products" },
  { v: "stock", t: "Stock" },
  { v: "return", t: "Returns" },
  { v: "review", t: "Reviews" },
  { v: "coupon", t: "Coupons" },
  { v: "collection", t: "Collections" },
  { v: "category", t: "Categories" },
  { v: "zone", t: "Shipping zones" },
  { v: "partner", t: "Partners" },
  { v: "settings", t: "Settings" },
  { v: "export", t: "Exports" },
];

export default async function SellerAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const raw = parseSearch(sp.entity);
  const entity = ENTITIES.some((e) => e.v === raw) ? raw : "";
  const entityId = parseSearch(sp.id);
  const list = await getAdminStoreAudit({ entity: entity || undefined, entityId: entityId || undefined, page: parsePage(sp.page) });
  const base = "/seller-portal/audit";

  return (
    <div className={PAGE}>
      <PageHeader
        title="Audit log"
        description="Every change made in the seller portal, and every automatic forward, newest first. Entries are never edited or removed."
      />
      <FilterPills label="Filter by what changed" current={entity} items={ENTITIES.map((e) => ({ value: e.v, text: e.t, href: hrefWith(base, { entity: e.v || undefined }) }))} />
      {entityId && (
        <p className="text-sm text-muted">
          Showing one record only.{" "}
          <a href={hrefWith(base, { entity: entity || undefined })} className="font-semibold text-accent hover:underline">
            Show all
          </a>
        </p>
      )}
      <div className="rounded-card border border-line bg-surface">
        <AuditList rows={list.rows} empty={entity || entityId ? "Nothing recorded for this filter." : "Nothing recorded yet. Changes show up here as the team works."} />
      </div>
      <AdminPagination page={list.page} totalPages={list.totalPages} totalItems={list.total} limit={list.pageSize} />
    </div>
  );
}
