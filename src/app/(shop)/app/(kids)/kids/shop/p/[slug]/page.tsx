import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, ShieldCheck, Sparkles, Truck, UsersRound } from "lucide-react";
import { getStoreProduct, getPublicStoreSettings } from "@/features/store/queries";
import { KidsBackLink, KidsSection, KidsTag, kidsCard } from "@/features/kids/components/kids-ui";
import { ProductGallery } from "@/features/store/components/product-gallery";
import { AddToBagButton } from "@/features/store/components/add-to-bag-button";
import { StockTag, StorePrice, StoreProductCard } from "@/features/store/components/store-product-card";
import { StoreCategoryIcon, StoreClosedNotice } from "@/features/store/components/store-filters";
import { formatINR } from "@/core/money";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} · RUXs Store`,
    description: product.tagline || `${product.name} for ages ${product.ageLabel}, from the RUXs Store.`,
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getStoreProduct(slug), getPublicStoreSettings()]);
  if (!product) notFound();

  return (
    <div className="space-y-6 pb-24">
      <KidsBackLink href={`/app/kids/shop/${product.category.id}`} label={product.category.name} />

      <div className="grid gap-5 sm:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <section aria-labelledby="product-title">
          <Link
            href={`/app/kids/shop/${product.category.id}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full text-sm font-medium text-kids-ink/65 hover:text-kids-ink focus-visible:outline-2 focus-visible:outline-kids-ink"
          >
            <StoreCategoryIcon name={product.category.icon} className="h-4 w-4" />
            {product.category.name}
          </Link>
          <h1 id="product-title" className="mt-1 font-kids text-[26px] font-semibold leading-tight tracking-tight">
            {product.name}
          </h1>
          {product.brand && <p className="mt-0.5 text-sm text-kids-ink/60">by {product.brand}</p>}
          {product.tagline && <p className="mt-2 text-[15px] leading-snug text-kids-ink/75">{product.tagline}</p>}

          <div className="mt-4">
            <StorePrice pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} discountPercent={product.discountPercent} size="lg" />
            <p className="mt-0.5 text-xs text-kids-ink/60">Inclusive of all taxes</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <KidsTag tone="sky">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              Ages {product.ageLabel}
            </KidsTag>
            <StockTag stock={product.stock} />
          </div>

          {product.skills.length > 0 && (
            <div className="mt-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-kids-ink/60" aria-hidden="true" /> Skills it builds
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {product.skills.map((s) => (
                  <li key={s}>
                    <KidsTag tone="peach">{s}</KidsTag>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 text-sm text-kids-ink/70">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {settings.serviceability === "geofence" ? `Delivering in ${settings.serviceCity} for now. ` : ""}
              {settings.deliveryFeePaise === 0
                ? "Free delivery."
                : settings.freeDeliveryAbovePaise != null
                  ? `Delivery ${formatINR(settings.deliveryFeePaise)}, free above ${formatINR(settings.freeDeliveryAbovePaise)}.`
                  : `Delivery ${formatINR(settings.deliveryFeePaise)}.`}
              {settings.codEnabled ? " Pay online or on delivery." : " Pay online."}
            </span>
          </p>
        </section>
      </div>

      {!settings.isOpen && <StoreClosedNotice message={settings.closedMessage} />}

      {product.description && (
        <section className={`${kidsCard} p-4`} aria-labelledby="product-about">
          <h2 id="product-about" className="font-kids text-lg font-semibold">
            About this product
          </h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-kids-ink/80">{product.description}</p>
        </section>
      )}

      {(product.boxContents.length > 0 || product.safetyNotes) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {product.boxContents.length > 0 && (
            <section className={`${kidsCard} p-4`} aria-labelledby="product-box">
              <h2 id="product-box" className="flex items-center gap-2 font-semibold">
                <Package className="h-4 w-4 text-kids-ink/60" aria-hidden="true" /> In the box
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-kids-ink/80 marker:text-kids-ink/40">
                {product.boxContents.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}
          {product.safetyNotes && (
            <section className={`${kidsCard} p-4`} aria-labelledby="product-safety">
              <h2 id="product-safety" className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-kids-ink/60" aria-hidden="true" /> Safety notes
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-kids-ink/80">{product.safetyNotes}</p>
            </section>
          )}
        </div>
      )}

      {product.related.length > 0 && (
        <KidsSection title="You may also like" href={`/app/kids/shop/${product.category.id}`}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {product.related.slice(0, 6).map((p) => (
              <li key={p.id}>
                <StoreProductCard product={p} />
              </li>
            ))}
          </ul>
        </KidsSection>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md border-t border-kids-ink/10 bg-kids-cream px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-base font-extrabold tabular-nums">{formatINR(product.pricePaise)}</p>
            <p className="text-xs text-kids-ink/60">{product.stock.label}</p>
          </div>
          <div className="flex min-w-0 flex-1 justify-end">
            <AddToBagButton
              size="lg"
              item={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0] ?? null,
                unitPricePaise: product.pricePaise,
                maxQty: product.stock.maxQty,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
