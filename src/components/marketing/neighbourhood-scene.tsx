import { cn } from "@/components/ui/cn";

/**
 * Neighbourhood scene illustration: homes, local kitchen, water store, dairy and class studio,
 * with a delivery bicycle along the street.
 */
export function NeighbourhoodScene({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] border border-line/80 bg-[#FEF1D3] shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <picture>
        <source srcSet="/brand/ruxs-neighbourhood-scene.webp" type="image/webp" />
        <img
          src="/brand/ruxs-neighbourhood-scene.png"
          alt="Illustration of a neighbourhood street with homes, local shops, and a person riding a bicycle"
          width={1024}
          height={330}
          className="block h-auto w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>
  );
}
