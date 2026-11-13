import Link from "next/link";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreCategories, getAdminStoreProduct } from "@/features/store/queries";
import { parseSearch } from "@/features/store/schemas";
import { StoreProductForm } from "@/features/store/seller-components/product-form";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "New product" };

/** `?from=<product id>` starts from a copy of that product (Duplicate on the product page). */
export default async function SellerNewProductPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSeller();
  const from = parseSearch((await searchParams).from);
  const [cats, source] = await Promise.all([getAdminStoreCategories(), from ? getAdminStoreProduct(from) : null]);
  const categories = cats.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }));
  const copyFrom = source?.product ?? null;

  return (
    <div className={PAGE}>
      <PageHeader
        back={{ href: "/seller-portal/products", label: "Products" }}
        title={copyFrom ? "Duplicate product" : "New product"}
        description={
          copyFrom
            ? `A copy of ${copyFrom.name}. Give it its own name and SKU. It starts hidden with no stock.`
            : "New products start hidden. Check the page, then turn it live."
        }
      />
      {categories.length === 0 ? (
        <p role="status" className="rounded-card border border-line bg-surface p-6 text-sm text-muted">
          Add a category first on{" "}
          <Link href="/seller-portal/categories" className="font-semibold text-accent hover:underline">
            Categories
          </Link>
          .
        </p>
      ) : (
        <div className="max-w-3xl rounded-card border border-line bg-surface p-4 sm:p-6">
          <StoreProductForm key={copyFrom?.id ?? "new"} product={null} copyFrom={copyFrom} categories={categories} />
        </div>
      )}
    </div>
  );
}
