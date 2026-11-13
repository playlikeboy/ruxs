import Link from "next/link";
import { FileUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { STORE_STOCK_REASONS } from "@/core/store";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreProducts } from "@/features/store/queries";
import { parsePage } from "@/features/store/schemas";
import { getSellerStockDemand, getSellerStockLog, parseStockReason } from "@/features/store/seller-queries";
import { FilterPills, hrefWith } from "@/features/store/seller-components/filter-pills";
import { PAGE, PageHeader, Panel, panelLink, rowLink } from "@/features/store/seller-components/seller-ui";
import { STOCK_REASON_LABELS, StockBadge, istDateTime } from "@/features/store/seller-components/store-labels";

export const metadata = { title: "Inventory" };

export default async function SellerInventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const sp = await searchParams;
  const reason = parseStockReason(sp.reason);
  const page = parsePage(sp.page);
  const base = "/seller-portal/inventory";

  const [log, low, out, demand] = await Promise.all([
    getSellerStockLog({ reason, page }),
    getAdminStoreProducts({ filter: "low" }),
    getAdminStoreProducts({ filter: "out" }),
    getSellerStockDemand(),
  ]);
  const short = [...out.rows, ...low.rows.filter((p) => !out.rows.some((o) => o.id === p.id))];
  const shortTotal = low.counts.low + low.counts.out;

  return (
    <div className={PAGE}>
      <PageHeader
        title="Inventory"
        description="What is running short, what households are waiting for, and every stock change across the catalogue."
        actions={
          <ButtonLink href="/seller-portal/products/import" variant="secondary" size="sm">
            <FileUp className="h-4 w-4" aria-hidden="true" /> Bulk stock update
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          id="short-h"
          title={<>Low and out of stock <span className="tabular-nums text-muted">({shortTotal})</span></>}
          note={`${low.counts.out} out of stock, ${low.counts.low} low.`}
          action={<Link href="/seller-portal/products?filter=low" className={panelLink}>See in Products</Link>}
        >
          {short.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">Every product is above its low-stock level.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {short.map((p) => (
                <li key={p.id}>
                  <Link href={`/seller-portal/products/${p.id}`} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${rowLink}`}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                      <span className="block text-xs tabular-nums text-muted">
                        {p.sku} · alert at {p.lowStockAt}
                      </span>
                    </span>
                    <StockBadge kind={p.stockKind} stock={p.stock} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="demand-h"
          title={<>Waiting for stock <span className="tabular-nums text-muted">({demand.waiting})</span></>}
          note="Households who asked for an email when a product is back. They are emailed on the next restock."
        >
          {demand.products.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">Nobody is waiting for a product right now.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {demand.products.map((p) => (
                <li key={p.productId}>
                  <Link href={`/seller-portal/products/${p.productId}`} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${rowLink}`}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                      <span className="block text-xs tabular-nums text-muted">
                        {p.sku} · {p.stock} in stock
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {p.waiting} <span className="font-normal text-muted">waiting</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section aria-labelledby="moves-h" className="space-y-3">
        <h2 id="moves-h" className="text-xl font-semibold text-ink">
          Stock changes <span className="text-base font-normal tabular-nums text-muted">({log.total})</span>
        </h2>
        <FilterPills
          label="Filter stock changes"
          current={reason}
          items={[
            { value: "all", text: "All", href: base },
            ...STORE_STOCK_REASONS.map((r) => ({ value: r, text: STOCK_REASON_LABELS[r], href: hrefWith(base, { reason: r }) })),
          ]}
        />
        {log.rows.length === 0 ? (
          <p className="rounded-card border border-line bg-surface px-4 py-6 text-sm text-muted">
            {reason === "all" ? "No stock changes yet. Restocks, orders and corrections are logged here." : "No stock changes of this kind."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">When</th>
                  <th scope="col" className="px-2 py-2.5 font-semibold">Product</th>
                  <th scope="col" className="px-2 py-2.5 font-semibold">Why</th>
                  <th scope="col" className="px-2 py-2.5 text-right font-semibold">Change</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Stock after</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {log.rows.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs tabular-nums text-muted">{istDateTime(m.createdAt)}</td>
                    <td className="max-w-[16rem] px-2 py-2.5">
                      <Link href={`/seller-portal/products/${m.productId}`} className="block truncate font-medium text-ink hover:text-accent hover:underline">
                        {m.productName}
                      </Link>
                      <span className="block text-xs text-muted">{m.sku}</span>
                    </td>
                    <td className="px-2 py-2.5 text-ink">
                      {STOCK_REASON_LABELS[m.reason]}
                      {m.orderId && m.orderNumber && (
                        <>
                          {" · "}
                          <Link href={`/seller-portal/orders/${m.orderId}`} className="tabular-nums text-accent hover:underline">
                            {m.orderNumber}
                          </Link>
                        </>
                      )}
                      {m.note && <span className="block max-w-[18rem] break-words text-xs text-muted">{m.note}</span>}
                    </td>
                    <td className={"px-2 py-2.5 text-right font-semibold tabular-nums " + (m.delta > 0 ? "text-good" : "text-bad")}>
                      {m.delta > 0 ? `+${m.delta}` : `−${Math.abs(m.delta)}`}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink">{m.stockAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={log.page} totalPages={log.totalPages} totalItems={log.total} limit={log.pageSize} />
      </section>
    </div>
  );
}
