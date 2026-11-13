import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyStoreWishlistIds, getStoreCollection } from "@/features/store/queries";
import { parseAgeBand, parseStoreSort } from "@/features/store/schemas";
import { KidsBackLink, KidsPageHeader, kidsCard } from "@/features/kids/components/kids-ui";
import { CoverArt } from "@/components/ui/cover-art";
import { StoreProductCard } from "@/features/store/components/store-product-card";
import { StoreAgeFilter, StoreClosedNotice, StoreSortLinks } from "@/features/store/components/store-filters";
import { storeAgeBand } from "@/core/store";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStoreCollection(slug);
  if (!page) return { title: "Collection not found" };
  return {
    title: `${page.collection.title} · RUXs Store`,
    description: page.collection.subtitle || `${page.collection.title}, picked by the RUXs Store.`,
  };
}

export default async function StoreCollectionPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  // No ?sort= keeps the order RUXs arranged the collection in.
  const sortParam = sp.sort === undefined ? "curated" : parseStoreSort(sp.sort);
  const [page, wishlistIds] = await Promise.all([getStoreCollection(slug, { age: parseAgeBand(sp.age), sort: sortParam }), getMyStoreWishlistIds()]);
  if (!page) notFound();
  const { settings, collection, age, sort } = page;
  const band = storeAgeBand(age);
  const wished = new Set(wishlistIds);
  const basePath = `/app/kids/shop/c/${collection.slug}`;

  return (
    <div className="space-y-5">
      <KidsBackLink href="/app/kids/shop" label="All products" />
      <KidsPageHeader title={collection.title} lead={collection.subtitle || undefined} />
      {!settings.isOpen && <StoreClosedNotice message={settings.closedMessage} />}
      <StoreAgeFilter basePath={basePath} age={age} sort={sort} defaultSort="curated" />
      <StoreSortLinks basePath={basePath} age={age} sort={sort} defaultSort="curated" />

      {collection.products.length === 0 ? (
        <div className={`${kidsCard} p-6 text-center`}>
          <CoverArt theme="kits" className="mx-auto h-24 w-32 rounded-[14px]" />
          <p className="mt-4 font-semibold">{band ? `Nothing here for ${band.label} yet` : "Nothing in this collection right now"}</p>
          <p className="mt-1 text-sm text-kids-ink/65">{band ? "Try another age band." : "Browse the rest of the store while RUXs restocks it."}</p>
          <Link href={band ? basePath : "/app/kids/shop"} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-accent">
            {band ? "Show all ages" : "Back to the store"}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-kids-ink/65" role="status">
            {collection.products.length} {collection.products.length === 1 ? "product" : "products"}
            {band ? ` for ${band.label}` : ""}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {collection.products.map((p) => (
              <li key={p.id}>
                <StoreProductCard product={p} wishlisted={wished.has(p.id)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
