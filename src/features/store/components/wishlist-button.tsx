"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";
import { toggleStoreWishlist } from "@/features/store/actions";

/**
 * Saves a product to my wishlist. `variant="icon"` is the round heart on a
 * product card; `variant="label"` is the worded button on the product page.
 */
export function WishlistButton({
  productId,
  name,
  wishlisted,
  variant = "icon",
  refreshOnChange = false,
  className,
}: {
  productId: string;
  name: string;
  wishlisted: boolean;
  variant?: "icon" | "label";
  /** Reload server data after a change (the wishlist page drops removed products). */
  refreshOnChange?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(wishlisted);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      try {
        const res = await toggleStoreWishlist({ productId, on: next });
        if (!res.ok) {
          setOn(!next);
          toast.error(res.error);
          return;
        }
        setOn(res.wishlisted);
        if (variant === "label") toast.success(res.wishlisted ? "Saved to your wishlist" : "Removed from your wishlist");
        if (refreshOnChange) router.refresh();
      } catch {
        setOn(!next);
        toast.error("Could not update your wishlist. Check your connection and try again.");
      }
    });
  }

  const heart = <Heart className={cn("h-5 w-5 transition-colors", on ? "fill-accent text-accent" : "text-kids-ink/70")} aria-hidden="true" />;

  if (variant === "label") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={on}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-kids-ink/15 bg-white px-4 text-sm font-semibold text-kids-ink transition hover:border-kids-ink/40 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
          className
        )}
      >
        {heart}
        {on ? "Saved" : "Save"}
        <span className="sr-only"> {name} to wishlist</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      aria-label={`Save ${name} to wishlist`}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs transition hover:bg-kids-cream active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
        className
      )}
    >
      {heart}
    </button>
  );
}
