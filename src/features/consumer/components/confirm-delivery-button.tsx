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
          toast.success("Order delivered. You and the store both confirmed.");
        } else {
          toast.success("Thanks for confirming. Waiting for the store to confirm.");
        }
        router.refresh();
      }
    });
  }

  if (isConsumerConfirmed && !isVendorConfirmed) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl border border-line bg-brand-water p-4 text-sm text-ink">
        <Clock className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
        <div>
          <p className="font-semibold text-ink">You confirmed you received this order</p>
          <p className="text-xs text-muted">Waiting for the store or delivery partner to confirm.</p>
        </div>
      </div>
    );
  }

  if (isVendorConfirmed && !isConsumerConfirmed) {
    return (
      <div className="space-y-3 rounded-2xl border border-good/30 bg-brand-leaf p-4">
        <div className="flex items-start gap-3">
          <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-good" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">The store marked this order as delivered</p>
            <p className="mt-0.5 text-xs text-muted">Confirm once you have your order.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={handleConfirm}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-good text-sm font-bold text-white transition hover:bg-good/90 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Confirming…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              I received my order
            </>
          )}
        </button>
      </div>
    );
  }

  // Active delivery (out_for_delivery or accepted): customer can also mark delivery received
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-ink">Received your delivery?</p>
          <p className="text-xs text-muted">Confirm once it reaches you so the order can be closed.</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={handleConfirm}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-good/30 bg-good/5 px-4 text-sm font-bold text-good transition hover:bg-good/10 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {pending ? "Confirming…" : "Mark received"}
        </button>
      </div>
    </div>
  );
}
