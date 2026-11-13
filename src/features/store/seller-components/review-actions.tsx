"use client";

import { Check, EyeOff, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { moderateStoreReview } from "../admin-actions";
import type { StoreReviewStatus } from "../types";
import { useStoreAction } from "./use-store-action";

const DONE: Record<StoreReviewStatus, string> = {
  published: "Review published",
  hidden: "Review hidden",
  pending: "Moved back to waiting",
};

/** Publish, hide or re-queue one review. */
export function ReviewActions({ reviewId, status }: { reviewId: string; status: StoreReviewStatus }) {
  const { pending, run } = useStoreAction();
  const set = (to: StoreReviewStatus) => run(() => moderateStoreReview({ reviewId, status: to }), { toastError: true, success: DONE[to] });

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" && (
        <button type="button" disabled={pending} onClick={() => set("published")} className={buttonClass("primary", "sm")}>
          <Check className="h-4 w-4" aria-hidden="true" /> Publish
        </button>
      )}
      {status !== "hidden" && (
        <button type="button" disabled={pending} onClick={() => set("hidden")} className={buttonClass("secondary", "sm")}>
          <EyeOff className="h-4 w-4" aria-hidden="true" /> Hide
        </button>
      )}
      {status !== "pending" && (
        <button type="button" disabled={pending} onClick={() => set("pending")} className={buttonClass("ghost", "sm")}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Back to waiting
        </button>
      )}
    </div>
  );
}
