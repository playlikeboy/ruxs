import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreCollection } from "@/features/store/admin-queries";
import { getAdminStoreProducts } from "@/features/store/queries";
import { parseSearch } from "@/features/store/schemas";
import { CollectionProducts } from "@/features/store/seller-components/collection-editor";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Collection" };

export default async function SellerCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSeller();
  const { id } = await params;
  const q = parseSearch((await searchParams).q);
  const [collection, found] = await Promise.all([getAdminStoreCollection(id), getAdminStoreProducts({ q, filter: "active" })]);
  if (!collection) notFound();

  return (
    <div className={PAGE}>
      <PageHeader
        back={{ href: "/seller-portal/collections", label: "Collections" }}
        title={collection.title}
        description={collection.subtitle || "Pick the products for this rail and put them in order. The first product shows first."}
        meta={<Badge tone={collection.isActive ? "good" : "neutral"}>{collection.isActive ? "Showing" : "Hidden"}</Badge>}
        actions={
          collection.isActive && collection.productCount > 0 ? (
            <ButtonLink href={`/app/kids/shop/c/${collection.slug}`} target="_blank" variant="secondary" size="sm">
              View in store <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </ButtonLink>
          ) : undefined
        }
      />
      <CollectionProducts collection={collection} candidates={found.rows} />
    </div>
  );
}
