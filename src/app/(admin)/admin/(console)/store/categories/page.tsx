import Link from "next/link";
import { getAdminStoreCategories } from "@/features/store/queries";
import { StoreCategoryEditor } from "@/features/store/admin-components/category-editor";

export const metadata = { title: "Store categories" };

export default async function AdminStoreCategoriesPage() {
  const categories = await getAdminStoreCategories();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-muted">
          <Link href="/admin/store" className="hover:text-ink hover:underline">RUXs Store</Link>
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          The chips households see in the store. Hide a category instead of removing it; its products stay put.
        </p>
      </div>
      <StoreCategoryEditor categories={categories} />
    </div>
  );
}
