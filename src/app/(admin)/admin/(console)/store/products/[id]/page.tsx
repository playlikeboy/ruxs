import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminStoreProduct } from "@/features/store/queries";
import { stockLabel } from "@/core/store";
import type { StoreStockReason } from "@/features/store/types";
import { StoreProductForm } from "@/features/store/admin-components/product-form";
import { StockAdjuster } from "@/features/store/admin-components/stock-adjuster";
import { ProductArchiveButton } from "@/features/store/admin-components/product-archive-button";
import { StockBadge, istDate, istDateTime } from "@/features/store/admin-components/store-labels";

export const metadata = { title: "Store product" };

const REASON: Record<StoreStockReason, string> = {
  restock: "Restock",
  order: "Order",
  cancel: "Order cancelled",
  adjust: "Correction",
};

export default async function AdminStoreProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminStoreProduct(id);
  if (!data) notFound();
  const { product: p, movements, categories, unitsSold } = data;
  const stock = stockLabel(p.stock, p.lowStockAt);
  const archived = p.archivedAt != null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/store/products" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Products
          </Link>
          <h1 className="break-words text-2xl font-bold tracking-tight text-ink sm:text-3xl">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {archived ? (
              <Badge tone="neutral">Archived {istDate(p.archivedAt)}</Badge>
            ) : p.isActive ? (
              <Badge tone="good">Live</Badge>
            ) : (
              <Badge tone="warn">Hidden</Badge>
            )}
            <StockBadge kind={stock.kind} stock={p.stock} />
            <span className="text-xs tabular-nums text-muted">
              {p.sku} · {unitsSold} sold · updated {istDateTime(p.updatedAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!archived && p.isActive && (
            <Link
              href={`/app/kids/shop/p/${p.slug}`}
              target="_blank"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-[13px] font-semibold text-ink transition hover:bg-bg"
            >
              View in store <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          )}
          <ProductArchiveButton productId={p.id} name={p.name} archived={archived} />
        </div>
      </div>

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
          <section aria-labelledby="stock-h" className="rounded-card border border-line bg-surface p-4">
            <h2 id="stock-h" className="text-base font-semibold text-ink">Adjust stock</h2>
            <p className="mb-3 mt-0.5 text-xs text-muted">Orders take stock automatically. Use this for deliveries and counts.</p>
            {archived ? (
              <p className="text-sm text-muted">Restore the product to change stock.</p>
            ) : (
              <StockAdjuster productId={p.id} stock={p.stock} />
            )}
          </section>

          <section aria-labelledby="log-h" className="rounded-card border border-line bg-surface">
            <h2 id="log-h" className="border-b border-line px-4 py-3 text-base font-semibold text-ink">Stock log</h2>
            {movements.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">No stock changes yet.</p>
            ) : (
              <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
                {movements.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">
                        {REASON[m.reason]}
                        {m.orderNumber && m.orderId && (
                          <>
                            {" · "}
                            <Link href={`/admin/store/orders/${m.orderId}`} className="tabular-nums text-accent hover:underline">
                              {m.orderNumber}
                            </Link>
                          </>
                        )}
                      </span>
                      <span className="block text-xs text-muted">{istDateTime(m.createdAt)}</span>
                      {m.note && <span className="block break-words text-xs text-muted">{m.note}</span>}
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      <span className={"block text-sm font-semibold " + (m.delta > 0 ? "text-good" : "text-bad")}>
                        {m.delta > 0 ? `+${m.delta}` : `−${Math.abs(m.delta)}`}
                      </span>
                      <span className="block text-xs text-muted">now {m.stockAfter}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
