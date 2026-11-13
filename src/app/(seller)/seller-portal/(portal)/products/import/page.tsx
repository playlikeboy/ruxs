import { PRODUCT_CSV_HEADERS, STORE_IMPORT_MAX_ROWS } from "@/features/store/csv";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreCategories } from "@/features/store/queries";
import { BulkStockTool, ExportProductsButton, ProductImportTool } from "@/features/store/seller-components/csv-tools";
import { PAGE, PageHeader, Panel } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Import products" };

export default async function SellerProductImportPage() {
  await requireSeller();
  const categories = await getAdminStoreCategories();

  return (
    <div className={PAGE}>
      <PageHeader
        back={{ href: "/seller-portal/products", label: "Products" }}
        title="Import and bulk stock"
        description="Work on many products at once in a spreadsheet. Export first to get a file in the right shape, edit it, then import it here."
        actions={<ExportProductsButton />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Panel id="imp-h" title="Import products" note={`Matched by SKU. Up to ${STORE_IMPORT_MAX_ROWS} rows per file.`} padded>
            <ProductImportTool />
          </Panel>
          <Panel id="bulk-h" title="Bulk stock update" note="Every change lands in the stock log." padded>
            <BulkStockTool />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel id="rules-h" title="How the import reads a row" padded>
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-ink">
              <li>A known SKU updates that product. A new SKU adds a product, hidden unless active is yes.</li>
              <li>A blank cell keeps the saved value.</li>
              <li>The stock column only sets opening stock for new SKUs. Use the bulk stock update for the rest.</li>
              <li>Price and MRP are rupees: 349 or 349.50.</li>
              <li>Lists (skills, box contents, images) use &quot; | &quot; between items.</li>
              <li>Type - or none to clear MRP, max age or weight.</li>
              <li>Featured and active take yes or no.</li>
              <li>Rows with a problem are skipped and listed. The good rows are still saved.</li>
            </ul>
          </Panel>
          <Panel id="cols-h" title="Columns" note="Any order. Only sku is required." padded>
            <p className="break-words font-mono text-xs leading-5 text-ink">{PRODUCT_CSV_HEADERS.join(", ")}</p>
          </Panel>
          <Panel id="cats-h" title="Category ids" note="Use these in the category column.">
            {categories.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">No categories yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <span className="min-w-0 truncate text-ink">{c.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted">{c.id}</span>
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
