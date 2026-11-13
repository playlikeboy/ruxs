import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreCategories } from "@/features/store/queries";
import { StoreCategoryEditor } from "@/features/store/seller-components/category-editor";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Categories" };

export default async function SellerCategoriesPage() {
  await requireSeller();
  const categories = await getAdminStoreCategories();
  return (
    <div className={PAGE}>
      <PageHeader title="Categories" description="The chips households see in the store. Hide a category instead of removing it; its products stay put." />
      <StoreCategoryEditor categories={categories} />
    </div>
  );
}
