import { formatINR } from "@/core/money";
import { getVendorProducts } from "@/features/products/queries";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const products = await getVendorProducts(slug);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Products & Shifts
          </h1>
          <p className="text-xs text-muted">
            Tiffin meals, water cans, cutoffs, and late-skip charges
          </p>
        </div>

        <ProductFormDialog slug={slug} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first tiffin meal or water product with its delivery shift and cutoff time."
          action={<ProductFormDialog slug={slug} triggerLabel="Add First Product" />}
        />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-surface border border-line rounded-[12px] space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-semibold text-ink">
                      {p.name}
                    </span>
                    <span className="px-2 py-0.5 bg-[#FAFAF7] border border-line rounded-full text-[10px] font-medium capitalize text-muted">
                      {p.kind}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-0.5 capitalize">
                    {p.shift} shift • Cutoff: {p.cutoffAt} IST
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono text-ink tabular-nums">
                    {formatINR(p.pricePaise)}
                  </div>
                  <div className="text-[11px] text-muted">per unit</div>
                </div>
              </div>

              <div className="pt-2 border-t border-line/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">Late Policy</span>
                  <span className="font-medium text-ink capitalize">
                    {p.lateRule} charge
                  </span>
                </div>
                {p.assetName && (
                  <div>
                    <span className="text-muted block text-[11px]">Asset Tracked</span>
                    <span className="font-medium text-ink capitalize">
                      {p.assetName} {p.depositPaise > 0 ? `(${formatINR(p.depositPaise)} dep)` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center justify-end">
                <ProductFormDialog
                  slug={slug}
                  product={p}
                  triggerLabel="Edit Configuration"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
