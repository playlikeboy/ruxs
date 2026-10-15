"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { nextVendorStep, STATUS_LABEL, type ShopOrderStatus } from "@/core/shop";
import { updateShopOrderStatus } from "@/features/shop-orders/actions";

const NEXT_LABEL: Partial<Record<ShopOrderStatus, string>> = {
  accepted: "Accept order",
  out_for_delivery: "Send out for delivery",
  delivered: "Mark delivered",
};

export function OrderStatusButtons({
  orderId,
  status,
  slug,
}: {
  orderId: string;
  status: ShopOrderStatus;
  slug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = nextVendorStep(status);

  function move(to: ShopOrderStatus) {
    let reason: string | undefined;
    if (to === "rejected" || to === "cancelled") {
      const answer = window.prompt(to === "rejected" ? "Why can't you take this order? (shown to the customer)" : "Reason for cancelling?");
      if (answer === null) return;
      reason = answer || undefined;
    }
    startTransition(async () => {
      const res = await updateShopOrderStatus({ slug, orderId, to, reason });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(STATUS_LABEL[to]);
        router.refresh();
      }
    });
  }

  if (!next) return null;
  return (
    <div className="flex gap-2">
      {status === "placed" ? (
        <button type="button" disabled={pending} onClick={() => move("rejected")} className="h-11 flex-1 rounded-[10px] border border-line text-sm font-semibold text-bad disabled:opacity-60">
          Decline
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => move("cancelled")} className="h-11 rounded-[10px] border border-line px-3 text-sm font-semibold text-muted disabled:opacity-60">
          Cancel
        </button>
      )}
      <button type="button" disabled={pending} onClick={() => move(next)} className="h-11 flex-[2] rounded-[10px] bg-accent text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60">
        {pending ? "Updating…" : NEXT_LABEL[next]}
      </button>
    </div>
  );
}
