import type { Metadata } from "next";
import Link from "next/link";
import { getStoreHome } from "@/features/store/queries";
import { parseAgeBand } from "@/features/store/schemas";
import { KidsPageHeader, KidsSection, kidsCard } from "@/features/kids/components/kids-ui";
import { CoverArt } from "@/components/ui/cover-art";
import { StoreProductCard } from "@/features/store/components/store-product-card";
import { StoreAgeFilter, StoreCategoryChips, StoreClosedNotice } from "@/features/store/components/store-filters";
import { formatINR } from "@/core/money";
import { storeAgeBand } from "@/core/store";

export const metadata: Metadata = {
  title: "RUXs Store · RUXs Kids",
  description: "DIY kits, robotics, science sets, art supplies and puzzles for children, sold and delivered by RUXs.",
};

export default async function StoreHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const home = await getStoreHome({ age: parseAgeBand(sp.age) });
  const { settings, featured, newArrivals, products, categories, age } = home;
  const band = storeAgeBand(age);
  const lead =
    settings.serviceability === "geofence"
      ? `Kits, puzzles and art supplies from RUXs, delivered in ${settings.serviceCity}.`
      : "Kits, puzzles and art supplies from RUXs, delivered to your door.";

  return (
    <div className="space-y-6">
      <KidsPageHeader title="Shop for kids" lead={lead} />

      {!settings.isOpen && <StoreClosedNotice message={settings.closedMessage} />}

      <StoreCategoryChips categories={categories} active={null} age={age} />
      <StoreAgeFilter basePath="/app/kids/shop" age={age} />

      {settings.freeDeliveryAbovePaise != null && settings.deliveryFeePaise > 0 && (
        <p className="text-sm text-kids-ink/70">
          Delivery {formatINR(settings.deliveryFeePaise)}, free on orders above {formatINR(settings.freeDeliveryAbovePaise)}.
        </p>
      )}

      {products.length === 0 ? (
        <div className={`${kidsCard} p-6 text-center`}>
          <CoverArt theme="kits" className="mx-auto h-24 w-32 rounded-[14px]" />
          <p className="mt-4 font-semibold">{band ? `Nothing for ${band.label} yet` : "The shelves are being stocked"}</p>
          <p className="mt-1 text-sm text-kids-ink/65">
            {band ? "Try another age, or see everything in the store." : "Products appear here as soon as RUXs lists them."}
          </p>
          {band && (
            <Link href="/app/kids/shop" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-accent">
              Show all ages
            </Link>
          )}
        </div>
      ) : (
        <>
          {!band && featured.length > 0 && (
            <KidsSection title="Featured">
              <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                {featured.map((p) => (
                  <li key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
                    <StoreProductCard product={p} />
                  </li>
                ))}
              </ul>
            </KidsSection>
          )}
          {!band && newArrivals.length > 0 && products.length > 8 && (
            <KidsSection title="New in">
              <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                {newArrivals.map((p) => (
                  <li key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
                    <StoreProductCard product={p} />
                  </li>
                ))}
              </ul>
            </KidsSection>
          )}
          <KidsSection title={band ? `For ${band.label}` : "All products"}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => (
                <li key={p.id}>
                  <StoreProductCard product={p} />
                </li>
              ))}
            </ul>
          </KidsSection>
        </>
      )}
    </div>
  );
}
