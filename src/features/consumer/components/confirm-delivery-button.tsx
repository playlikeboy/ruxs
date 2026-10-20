"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, PackageCheck } from "lucide-react";
import { confirmMyOrderDelivered } from "@/features/consumer/actions";
import type { ShopOrderStatus } from "@/core/shop";

export function ConfirmDeliveryButton({
  orderId,
  vendorDeliveredAt,
  consumerDeliveredAt,
  status,
}: {
  orderId: string;
  vendorDeliveredAt?: Date | string | null;
  consumerDeliveredAt?: Date | string | null;
  status: ShopOrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isConsumerConfirmed = Boolean(consumerDeliveredAt);
  const isVendorConfirmed = Boolean(vendorDeliveredAt);

  // If already delivered, no need for active confirmation button
  if (status === "delivered" || status === "cancelled" || status === "rejected" || status === "awaiting_payment") {
    return null;
  }

  function handleConfirm() {
    startTransition(async () => {
      const res = await confirmMyOrderDelivered({ orderId });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        if ("isDelivered" in res && res.isDelivered) {
          toast.success("Order marked delivered! Both parties confirmed.");
        } else {
          toast.success("Delivery confirmed! Waiting for store confirmation.");
        }
        router.refresh();
      }
    });
  }

  if (isConsumerConfirmed && !isVendorConfirmed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
        <Clock className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-blue-950">You confirmed delivery receipt</p>
          <p className="text-xs text-blue-800/80">Waiting for store / delivery partner to confirm and finalize.</p>
        </div>
      </div>
    );
  }

  if (isVendorConfirmed && !isConsumerConfirmed) {
    return (
      <div className="space-y-3 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-emerald-950">Store marked this order as delivered!</p>
            <p className="mt-0.5 text-xs text-emerald-800">Please confirm if you have received your order.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={handleConfirm}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming receipt…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirm Delivery Received
            </>
          )}
        </button>
      </div>
    );
  }

  // Active delivery (out_for_delivery or accepted): customer can also mark delivery received
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Received your delivery?</p>
          <p className="text-xs text-neutral-500">Confirm receipt so the delivery can be finalized.</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={handleConfirm}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Mark Delivered
        </button>
      </div>
    </div>
  );
}
