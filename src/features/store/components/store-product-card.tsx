import Link from "next/link";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/components/ui/cn";
import { formatINR } from "@/core/money";
import type { StoreProductCard as Product, StoreStock } from "@/features/store/types";
import { AddToBagButton } from "./add-to-bag-button";

/** Stock as word plus colour: "Out of stock", "Only 3 left", "In stock". */
export function StockTag({ stock, className }: { stock: StoreStock; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        stock.kind === "out" && "bg-bad/10 text-bad",
        stock.kind === "low" && "bg-kids-sunny/60 text-warn",
        stock.kind === "in" && "bg-kids-mint/70 text-good",
        className
      )}
    >
      {stock.label}
    </span>
  );
}

/** Price, MRP struck through and whole-percent saving. */
export function StorePrice({ pricePaise, mrpPaise, discountPercent, size = "sm" }: { pricePaise: number; mrpPaise: number | null; discountPercent: number; size?: "sm" | "lg" }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-extrabold tabular-nums text-kids-ink", size === "lg" ? "text-2xl" : "text-base")}>{formatINR(pricePaise)}</span>
      {discountPercent > 0 && mrpPaise != null && (
        <>
          <span className={cn("tabular-nums text-kids-ink/55 line-through", size === "lg" ? "text-base" : "text-xs")}>
            <span className="sr-only">MRP </span>
            {formatINR(mrpPaise)}
          </span>
          <span className={cn("font-bold text-good", size === "lg" ? "text-base" : "text-xs")}>{discountPercent}% off</span>
        </>
      )}
    </p>
  );
}

/** Product photo or the drawn kits artwork when none was uploaded. */
export function StoreProductImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (!src) return <CoverArt theme="kits" className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image host
    <img src={src} alt={alt} loading="lazy" decoding="async" className={cn("object-cover", className)} />
  );
}

/** Grid card: whole card links to the product; the Add control sits outside the link. */
export function StoreProductCard({ product }: { product: Product }) {
  const href = `/app/kids/shop/p/${product.slug}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[16px] border border-kids-ink/10 bg-white transition-[border-color,box-shadow] duration-200 hover:border-kids-ink/25 hover:shadow-[0_4px_16px_rgba(23,71,55,0.06)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-kids-ink">
      <div className="relative aspect-square bg-kids-cream">
        <StoreProductImage src={product.image} alt="" className="h-full w-full" />
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-good shadow-xs">{product.discountPercent}% off</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs font-medium text-kids-ink/60">{product.ageLabel}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-kids-ink">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5">
          <StorePrice pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} discountPercent={product.discountPercent} />
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2.5">
          {product.stock.kind === "low" ? <StockTag stock={product.stock} /> : <span />}
          <div className="relative z-10">
            <AddToBagButton
              item={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                unitPricePaise: product.pricePaise,
                maxQty: product.stock.maxQty,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
