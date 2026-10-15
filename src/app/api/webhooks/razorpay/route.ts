import { verifyWebhookSignature } from "@/lib/razorpay";
import { failPayment, settlePayment } from "@/features/payments/settle";

/**
 * Razorpay webhook (dashboard → Webhooks → https://ruxs.in/api/webhooks/razorpay).
 * Events: payment.captured, order.paid, payment.failed. Safe to receive twice.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return Response.json({ ok: false, error: "bad signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; error_description?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (payment?.order_id && payment.id) {
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
