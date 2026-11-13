import { cn } from "@/components/ui/cn";

/**
 * Neighbourhood scene illustration: homes, local kitchen, water store, dairy and class studio,
 * with a delivery bicycle along the street. Decorative by default (empty alt); pass `alt` when
 * the scene carries meaning on its own. `priority` loads it eagerly for above-the-fold use.
 */
export function NeighbourhoodScene({
  className,
  imgClassName,
  alt = "",
  priority = false,
}: {
  className?: string;
  imgClassName?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <picture className={cn("block", className)}>
      <source srcSet="/brand/ruxs-neighbourhood-scene.webp" type="image/webp" />
      <img
        src="/brand/ruxs-neighbourhood-scene.png"
        alt={alt}
        width={1024}
        height={330}
        className={cn("block h-auto w-full", imgClassName)}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
