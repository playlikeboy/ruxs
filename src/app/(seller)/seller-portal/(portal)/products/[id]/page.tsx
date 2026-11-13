import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { stockLabel } from "@/core/store";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreProduct } from "@/features/store/queries";
import { ProductArchiveButton } from "@/features/store/seller-components/product-archive-button";
import { StoreProductForm } from "@/features/store/seller-components/product-form";
import { PAGE, PageHeader, Panel, panelLink } from "@/features/store/seller-components/seller-ui";
import { StockAdjuster } from "@/features/store/seller-components/stock-adjuster";
import { STOCK_REASON_LABELS, StockBadge, istDate, istDateTime } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Product" };

export default async function SellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSeller();
  const { id } = await params;
  const data = await getAdminStoreProduct(id);
  if (!data) notFound();
  const { product: p, movements, categories, unitsSold } = data;
  const stock = stockLabel(p.stock, p.lowStockAt);
  const archived = p.archivedAt != null;

  return (
    <div className={PAGE}>
      <PageHeader
        back={{ href: "/seller-portal/products", label: "Products" }}
        title={p.name}
        meta={
          <>
            {archived ? <Badge tone="neutral">Archived {istDate(p.archivedAt)}</Badge> : p.isActive ? <Badge tone="good">Live</Badge> : <Badge tone="warn">Hidden</Badge>}
            <StockBadge kind={stock.kind} stock={p.stock} />
            <span className="text-xs tabular-nums text-muted">
              {p.sku} · {unitsSold} sold · updated {istDateTime(p.updatedAt)}
            </span>
          </>
        }
        actions={
          <>
            {!archived && p.isActive && (
              <ButtonLink href={`/app/kids/shop/p/${p.slug}`} target="_blank" variant="secondary" size="sm">
                View in store <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </ButtonLink>
            )}
            <ButtonLink href={`/seller-portal/products/new?from=${p.id}`} variant="secondary" size="sm">
              <Copy className="h-4 w-4" aria-hidden="true" /> Duplicate
            </ButtonLink>
            <ProductArchiveButton productId={p.id} name={p.name} archived={archived} />
          </>
        }
      />

      {archived && (
        <p role="status" className="rounded-[12px] bg-butter px-4 py-3 text-sm text-warn">
          Archived products are hidden everywhere. Restore it to sell it again.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-card border border-line bg-surface p-4 sm:p-6">
          <StoreProductForm key={p.updatedAt.toISOString()} product={p} categories={categories} />
        </div>

        <aside className="space-y-6">
          <Panel id="stock-h" title="Adjust stock" note="Orders take stock automatically. Use this for deliveries and counts." padded>
            {archived ? <p className="text-sm text-muted">Restore the product to change stock.</p> : <StockAdjuster key={p.stock} productId={p.id} stock={p.stock} />}
          </Panel>

          <Panel id="log-h" title="Stock log" note="Newest 30 changes." action={<Link href="/seller-portal/inventory" className={panelLink}>All stock changes</Link>}>
            {movements.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">No stock changes yet.</p>
            ) : (
              <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
                {movements.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">
                        {STOCK_REASON_LABELS[m.reason]}
                        {m.orderNumber && m.orderId && (
                          <>
                            {" · "}
                            <Link href={`/seller-portal/orders/${m.orderId}`} className="tabular-nums text-accent hover:underline">
                              {m.orderNumber}
                            </Link>
                          </>
                        )}
                      </span>
                      <span className="block text-xs text-muted">{istDateTime(m.createdAt)}</span>
                      {m.note && <span className="block break-words text-xs text-muted">{m.note}</span>}
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      <span className={"block text-sm font-semibold " + (m.delta > 0 ? "text-good" : "text-bad")}>{m.delta > 0 ? `+${m.delta}` : `−${Math.abs(m.delta)}`}</span>
                      <span className="block text-xs text-muted">now {m.stockAfter}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
