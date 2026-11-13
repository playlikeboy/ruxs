import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyStoreWishlistIds, getStoreCategory } from "@/features/store/queries";
import { parseAgeBand, parseStoreSort } from "@/features/store/schemas";
import { KidsBackLink, KidsPageHeader, kidsCard } from "@/features/kids/components/kids-ui";
import { CoverArt } from "@/components/ui/cover-art";
import { StoreProductCard } from "@/features/store/components/store-product-card";
import { StoreAgeFilter, StoreCategoryChips, StoreClosedNotice, StoreSortLinks } from "@/features/store/components/store-filters";
import { storeAgeBand } from "@/core/store";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const page = await getStoreCategory(category);
  if (!page) return { title: "Category not found" };
  return {
    title: `${page.category.name} · RUXs Store`,
    description: page.category.description || `${page.category.name} for children from the RUXs Store.`,
  };
}

export default async function StoreCategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const [page, wishlistIds] = await Promise.all([
    getStoreCategory(category, { age: parseAgeBand(sp.age), sort: parseStoreSort(sp.sort) }),
    getMyStoreWishlistIds(),
  ]);
  if (!page) notFound();
  const wished = new Set(wishlistIds);
  const { settings, products, categories, age, sort } = page;
  const band = storeAgeBand(age);
  const basePath = `/app/kids/shop/${page.category.id}`;

  return (
    <div className="space-y-5">
      <KidsBackLink href="/app/kids/shop" label="All products" />
      <KidsPageHeader title={page.category.name} lead={page.category.description || undefined} />
      {!settings.isOpen && <StoreClosedNotice message={settings.closedMessage} />}
      <StoreCategoryChips categories={categories} active={page.category.id} age={age} />
      <StoreAgeFilter basePath={basePath} age={age} sort={sort} />
      <StoreSortLinks basePath={basePath} age={age} sort={sort} />

      {products.length === 0 ? (
        <div className={`${kidsCard} p-6 text-center`}>
          <CoverArt theme="kits" className="mx-auto h-24 w-32 rounded-[14px]" />
          <p className="mt-4 font-semibold">{band ? `Nothing here for ${band.label} yet` : "Nothing in this category yet"}</p>
          <p className="mt-1 text-sm text-kids-ink/65">
            {band ? "Try another age band." : "Browse the other categories while RUXs stocks this one."}
          </p>
          <Link href={band ? basePath : "/app/kids/shop"} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-accent">
            {band ? "Show all ages" : "Back to the store"}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-kids-ink/65" role="status">
            {products.length} {products.length === 1 ? "product" : "products"}
            {band ? ` for ${band.label}` : ""}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => (
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
