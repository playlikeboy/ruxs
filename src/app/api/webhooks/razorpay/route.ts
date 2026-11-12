import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { failPayment, settlePayment } from "@/features/payments/settle";
import { failStorePayment, isStoreRazorpayOrder, settleStorePayment } from "@/features/store/settle";

const webhookEvent = z.object({
  event: z.string().optional(),
  payload: z
    .object({
      payment: z
        .object({
          entity: z
            .object({
              id: z.string().min(1).optional(),
              order_id: z.string().min(1).nullish(),
              amount: z.number().int().nonnegative().optional(),
              error_description: z.string().nullish(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Razorpay webhook (dashboard → Webhooks → https://ruxs.in/api/webhooks/razorpay).
 * Events: payment.captured, order.paid, payment.failed. Safe to receive twice.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  let signatureOk: boolean;
  try {
    signatureOk = !!signature && verifyWebhookSignature(raw, signature);
  } catch (err) {
    // Razorpay keys missing: a 5xx makes Razorpay retry once it is configured.
    console.error("[razorpay webhook] cannot verify signature", err instanceof Error ? err.message : err);
    return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  }
  if (!signatureOk) {
    return Response.json({ ok: false, error: "bad signature" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const parsed = webhookEvent.safeParse(json);
  if (!parsed.success) {
    // Signed by Razorpay but not a shape we act on: acknowledge so it is not retried.
    console.warn("[razorpay webhook] ignored unexpected payload shape");
    return Response.json({ ok: true, ignored: true });
  }
  const event = parsed.data;

  const payment = event.payload?.payment?.entity;
  if (payment?.order_id && payment.id && (await isStoreRazorpayOrder(payment.order_id))) {
    // RUXs Store orders have their own payments table, kept apart from vendor payouts.
    if (event.event === "payment.captured" || event.event === "order.paid") {
      await settleStorePayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        amountPaise: payment.amount,
      });
    } else if (event.event === "payment.failed") {
      await failStorePayment(payment.order_id, payment.error_description ?? "Payment failed");
    }
  } else if (payment?.order_id && payment.id) {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      await settlePayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        amountPaise: payment.amount,
      });
    } else if (event.event === "payment.failed") {
      await failPayment(payment.order_id, payment.error_description ?? "Payment failed");
    }
  }

  // Unknown or unrelated events are acknowledged so Razorpay stops retrying.
  return Response.json({ ok: true });
}
