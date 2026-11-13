import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getMyStoreWishlist } from "@/features/store/queries";
import { KidsPageHeader, kidsCard, kidsPrimaryButton } from "@/features/kids/components/kids-ui";
import { StoreProductCard } from "@/features/store/components/store-product-card";
import { StockAlertButton } from "@/features/store/components/stock-alert-button";

export const metadata: Metadata = { title: "Wishlist · RUXs Store" };

export default async function StoreWishlistPage() {
  const items = await getMyStoreWishlist();

  return (
    <div className="space-y-5">
      <KidsPageHeader title="Wishlist" lead="Products you saved from the RUXs Store." />
      {items.length === 0 ? (
        <div className={`${kidsCard} flex flex-col items-center px-6 py-10 text-center`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kids-peach/60">
            <Heart className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-4 font-kids text-xl font-semibold">Nothing saved yet</p>
          <p className="mt-1 max-w-xs text-sm text-kids-ink/65">Tap the heart on a product to keep it here for later.</p>
          <Link href="/app/kids/shop" className={`${kidsPrimaryButton} mt-5`}>
            Browse the store
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-kids-ink/65" role="status">
            {items.length} saved {items.length === 1 ? "product" : "products"}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                <div className="flex-1">
                  <StoreProductCard product={p} wishlisted refreshOnWishlistChange />
                </div>
                {p.stock.kind === "out" && <StockAlertButton productId={p.id} name={p.name} subscribed={p.stockAlert} size="sm" />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
