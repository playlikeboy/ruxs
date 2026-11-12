"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";
import { bagActions, bagQty, useStoreBag, type BagItem } from "./bag-store";

const stepBtn =
  "flex h-full w-11 items-center justify-center rounded-full transition-colors hover:bg-white/15 active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink";

/**
 * Add a RUXs Store product to the bag, then a − qty + stepper once it is in.
 * `size="lg"` is the full-width button on the product page.
 */
export function AddToBagButton({ item, size = "sm" }: { item: Omit<BagItem, "qty">; size?: "sm" | "lg" }) {
  const qty = bagQty(useStoreBag(), item.productId);
  const soldOut = item.maxQty <= 0;
  const lg = size === "lg";

  if (soldOut) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-kids-ink/15 bg-kids-ink/[0.04] font-semibold text-kids-ink/60",
          lg ? "min-h-12 w-full px-5 text-[15px]" : "min-h-10 px-4 text-sm"
        )}
      >
        Out of stock
      </span>
    );
  }

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!bagActions.add(item)) toast.error("Your bag is full. Check out or remove an item first.");
          else if (lg) toast.success("Added to bag");
        }}
        aria-label={lg ? undefined : `Add ${item.name} to bag`}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-kids-ink font-bold text-white shadow-xs transition hover:bg-kids-ink/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
          lg ? "min-h-12 w-full px-5 text-[15px]" : "min-h-10 px-4 text-sm"
        )}
      >
        {lg ? <ShoppingBag className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        {lg ? "Add to bag" : "Add"}
      </button>
    );
  }

  const stepper = (
    <div
      className={cn(
        "flex items-center justify-between rounded-full bg-kids-ink text-white shadow-xs",
        lg ? "h-12 flex-1" : "h-10 w-[7.5rem]"
      )}
    >
      <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => bagActions.setQty(item.productId, qty - 1)} className={stepBtn}>
        <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
      <span className="text-sm font-bold tabular-nums" aria-live="polite">
        {qty}
        <span className="sr-only"> in bag</span>
      </span>
      <button
        type="button"
        aria-label={`Add one ${item.name}`}
        onClick={() => bagActions.setQty(item.productId, qty + 1)}
        disabled={qty >= item.maxQty}
        className={stepBtn}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );

  if (!lg) return stepper;
  return (
    <div className="flex w-full items-center gap-2">
      {stepper}
      <Link
        href="/app/kids/shop/bag"
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-kids-ink/20 bg-white px-4 text-[15px] font-bold text-kids-ink transition hover:border-kids-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" /> View bag
      </Link>
    </div>
  );
}
