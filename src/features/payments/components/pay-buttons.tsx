"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatINR } from "@/core/money";
import {
  startBookingPayment,
  startDuesPayment,
  startOrderPayment,
  type CheckoutOptions,
} from "@/features/payments/actions";
import { useRazorpay, type PayOutcome } from "./use-razorpay";

type StartResult = { ok: true; checkout: CheckoutOptions } | { ok: false; error: string };

function report(outcome: PayOutcome) {
  if (outcome.status === "paid") toast.success("Payment received");
  else if (outcome.status === "failed") toast.error(outcome.error);
}

/**
 * Starts checkout and opens Razorpay. `busy` covers the server call too, so a
 * double tap cannot start two checkouts before the payment window opens.
 */
function usePayFlow(start: () => Promise<StartResult>) {
  const router = useRouter();
  const { pay, busy: paying } = useRazorpay();
  const [starting, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      try {
        const started = await start();
        if (!started.ok) {
          toast.error(started.error);
          return;
        }
        report(await pay(started.checkout));
      } catch {
        toast.error("Could not start the payment. Please try again.");
      }
      router.refresh();
    });
  return { run, busy: starting || paying };
}

/** "Pay now" for an online order that is still waiting for payment. */
export function PayOrderButton({ orderId, totalPaise }: { orderId: string; totalPaise: number }) {
  const { run, busy } = usePayFlow(() => startOrderPayment({ orderId }));
  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={run}
      className="h-12 w-full rounded-xl bg-accent text-[15px] font-bold text-white disabled:opacity-60"
    >
      {busy ? "Opening payment…" : `Pay ${formatINR(totalPaise)} now`}
    </button>
  );
}

/** Pays everything owed to one store through RUXs. */
export function PayDuesButton({ vendorId, label }: { vendorId: string; label: string }) {
  const { run, busy } = usePayFlow(() => startDuesPayment({ vendorId }));
  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={run}
      className="h-11 rounded-xl bg-surface px-4 text-sm font-bold text-ink disabled:opacity-60"
    >
      {busy ? "Opening…" : label}
    </button>
  );
}

/** "Pay now" for an online booking whose slot is still held. */
export function PayBookingButton({ bookingId, pricePaise }: { bookingId: string; pricePaise: number }) {
  const { run, busy } = usePayFlow(() => startBookingPayment({ bookingId }));
  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={run}
      className="h-12 w-full rounded-xl bg-accent text-[15px] font-bold text-white disabled:opacity-60"
    >
      {busy ? "Opening payment…" : `Pay ${formatINR(pricePaise)} to confirm`}
    </button>
  );
}
