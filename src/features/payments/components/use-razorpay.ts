"use client";

import { useCallback, useState } from "react";
import { confirmCheckout, type CheckoutOptions } from "@/features/payments/actions";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
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

export type PayOutcome = { status: "paid" } | { status: "dismissed" } | { status: "failed"; error: string };

/** Opens Razorpay Checkout for server-created options and resolves once it settles. */
export function useRazorpay() {
  const [busy, setBusy] = useState(false);

  const pay = useCallback(async (checkout: CheckoutOptions): Promise<PayOutcome> => {
    setBusy(true);
    try {
      if (!(await loadScript()) || !window.Razorpay) {
        return { status: "failed", error: "Could not load the payment window. Check your connection." };
      }
      return await new Promise<PayOutcome>((resolve) => {
        const rzp = new window.Razorpay!({
          key: checkout.keyId,
          order_id: checkout.razorpayOrderId,
          amount: checkout.amountPaise,
          currency: "INR",
          name: "RUXs",
          description: checkout.description,
          prefill: checkout.prefill,
          theme: { color: "#BD4B2A" },
          modal: { ondismiss: () => resolve({ status: "dismissed" }) },
          handler: async (res: RazorpayResponse) => {
            const confirmed = await confirmCheckout({
              razorpayOrderId: res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            });
            resolve(confirmed.ok ? { status: "paid" } : { status: "failed", error: confirmed.error });
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
