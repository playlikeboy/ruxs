"use client";

import { UiIcon } from "@/components/ui/app-icon";

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
  vendorDeliveredAt,
  consumerDeliveredAt,
}: {
  orderId: string;
  status: ShopOrderStatus;
  slug: string;
  vendorDeliveredAt?: Date | string | null;
  consumerDeliveredAt?: Date | string | null;
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
        if ("waitingFor" in res && res.waitingFor === "consumer") {
          toast.success("Delivery marked! Awaiting customer confirmation.");
        } else {
          toast.success(STATUS_LABEL[to]);
        }
        router.refresh();
      }
    });
  }

  // If vendor has already marked delivered and waiting for consumer
  const vendorAlreadyDelivered = Boolean(vendorDeliveredAt && !consumerDeliveredAt);
  const customerConfirmed = Boolean(consumerDeliveredAt && !vendorDeliveredAt);

  if (vendorAlreadyDelivered && (status === "out_for_delivery" || status === "accepted")) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-center text-xs font-semibold text-amber-800">
        <UiIcon name="hourglass" /> You marked delivered · Waiting for customer confirmation
      </div>
    );
  }

  if (!next) return null;
  return (
    <div className="space-y-2">
      {customerConfirmed && (
        <p className="rounded-[8px] bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <UiIcon name="check" /> Customer confirmed delivery! Tap below to finalize:
        </p>
      )}
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
          {pending ? "Updating…" : customerConfirmed && next === "delivered" ? "Confirm & Finalize" : NEXT_LABEL[next]}
        </button>
      </div>
    </div>
  );
}
