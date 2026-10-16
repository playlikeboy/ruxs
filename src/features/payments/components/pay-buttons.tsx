"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatINR } from "@/core/money";
import { startDuesPayment, startOrderPayment } from "@/features/payments/actions";
import { useRazorpay, type PayOutcome } from "./use-razorpay";

function report(outcome: PayOutcome) {
  if (outcome.status === "paid") toast.success("Payment received");
  else if (outcome.status === "failed") toast.error(outcome.error);
}

/** "Pay now" for an online order that is still waiting for payment. */
export function PayOrderButton({ orderId, totalPaise }: { orderId: string; totalPaise: number }) {
  const router = useRouter();
  const { pay, busy } = useRazorpay();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        const start = await startOrderPayment({ orderId });
        if (!start.ok) {
          toast.error(start.error);
          return;
        }
        report(await pay(start.checkout));
        router.refresh();
      }}
      className="h-12 w-full rounded-xl bg-accent text-[15px] font-bold text-white disabled:opacity-60"
    >
      {busy ? "Opening payment…" : `Pay ${formatINR(totalPaise)} now`}
    </button>
  );
}

/** Pays everything owed to one store through RUXs. */
export function PayDuesButton({ vendorId, label }: { vendorId: string; label: string }) {
  const router = useRouter();
  const { pay, busy } = useRazorpay();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        const start = await startDuesPayment({ vendorId });
        if (!start.ok) {
          toast.error(start.error);
          return;
        }
        report(await pay(start.checkout));
        router.refresh();
      }}
      className="h-11 rounded-xl bg-white px-4 text-sm font-bold text-ink disabled:opacity-60"
    >
      {busy ? "Opening…" : label}
    </button>
  );
}
