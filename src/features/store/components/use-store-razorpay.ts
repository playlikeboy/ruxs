"use client";

import { useCallback, useState } from "react";
import { confirmStoreCheckout } from "@/features/store/actions";
import type { StoreCheckoutOptions } from "@/features/store/types";

/**
 * Razorpay Checkout for RUXs Store orders. Same script loader as
 * `features/payments/components/use-razorpay.ts`, but the browser callback
 * confirms through `confirmStoreCheckout` (store payments are kept apart from
 * vendor payments). The webhook settles the payment if this callback is lost.
 */

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckout {
  open: () => void;
  on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayCheckout;

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function razorpayCtor(): RazorpayCtor | undefined {
  return (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
}

function loadScript(): Promise<boolean> {
  if (razorpayCtor()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export type StorePayOutcome = { status: "paid" } | { status: "dismissed" } | { status: "failed"; error: string };

export function useStoreRazorpay() {
  const [busy, setBusy] = useState(false);

  const pay = useCallback(async (checkout: StoreCheckoutOptions): Promise<StorePayOutcome> => {
    setBusy(true);
    try {
      const Razorpay = (await loadScript()) ? razorpayCtor() : undefined;
      if (!Razorpay) return { status: "failed", error: "Could not load the payment window. Check your connection." };
      return await new Promise<StorePayOutcome>((resolve) => {
        const rzp = new Razorpay({
          key: checkout.keyId,
          order_id: checkout.razorpayOrderId,
          amount: checkout.amountPaise,
          currency: "INR",
          name: "RUXs Store",
          description: checkout.description,
          prefill: checkout.prefill,
          theme: { color: "#174737" },
          modal: { ondismiss: () => resolve({ status: "dismissed" }) },
          handler: async (res: RazorpayResponse) => {
            try {
              const confirmed = await confirmStoreCheckout({
                razorpayOrderId: res.razorpay_order_id,
                razorpayPaymentId: res.razorpay_payment_id,
                razorpaySignature: res.razorpay_signature,
              });
              resolve(confirmed.ok ? { status: "paid" } : { status: "failed", error: confirmed.error });
            } catch {
              resolve({ status: "failed", error: "Payment is being confirmed. Refresh in a minute to see it." });
            }
          },
        });
        rzp.on("payment.failed", (res) => resolve({ status: "failed", error: res.error?.description ?? "Payment failed" }));
        rzp.open();
      });
    } finally {
      setBusy(false);
    }
  }, []);

  return { pay, busy };
}
