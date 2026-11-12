import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminStoreCategories } from "@/features/store/queries";
import { StoreProductForm } from "@/features/store/admin-components/product-form";

export const metadata = { title: "New store product" };

export default async function AdminNewStoreProductPage() {
  const cats = await getAdminStoreCategories();
  const categories = cats.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Link href="/admin/store/products" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">New product</h1>
        <p className="mt-1 text-sm text-muted">New products start hidden. Check the page, then turn it live.</p>
      </div>
      {categories.length === 0 ? (
        <p role="status" className="rounded-card border border-line bg-surface p-6 text-sm text-muted">
          Add a category first on <Link href="/admin/store/categories" className="font-semibold text-accent hover:underline">Categories</Link>.
        </p>
      ) : (
        <div className="max-w-3xl rounded-card border border-line bg-surface p-4 sm:p-6">
          <StoreProductForm product={null} categories={categories} />
        </div>
      )}
    </div>
  );
}
