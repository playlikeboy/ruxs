import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreCollections } from "@/features/store/admin-queries";
import { CollectionManager } from "@/features/store/seller-components/collection-editor";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Collections" };

export default async function SellerCollectionsPage() {
  await requireSeller();
  const collections = await getAdminStoreCollections();
  return (
    <div className={PAGE}>
      <PageHeader
        title="Collections"
        description="Hand-picked rows of products on the store home, shown in this order. A hidden or empty collection is not shown."
      />
      <CollectionManager collections={collections} />
    </div>
  );
}
