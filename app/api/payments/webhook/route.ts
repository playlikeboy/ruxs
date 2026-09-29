import { PaymentService } from "@/src/modules/payments/payment-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { getEnv } from "@/src/shared/config/env";

export async function POST(request: Request) {
  try {
    const rawPayload = await request.text();
    const signature = request.headers.get("x-ruxs-signature");
    const env = getEnv();

    if (!signature || !env.PAYMENT_WEBHOOK_SECRET) {
      return Response.json(createErrorResponse("FORBIDDEN", "Webhook signature required"), { status: 403 });
    }

    const body = JSON.parse(rawPayload) as { orderId?: string; paymentId?: string; utr?: string };
    if (!body.orderId || !body.paymentId || !body.utr) {
      return Response.json(createErrorResponse("VALIDATION_FAILED", "Missing required payment webhook fields"), { status: 400 });
    }

    const result = await PaymentService.handleWebhookPaymentSuccess({
      gatewayOrderId: body.orderId,
      gatewayPaymentId: body.paymentId,
      bankUtr: body.utr,
      rawPayload,
      signature,
      webhookSecret: env.PAYMENT_WEBHOOK_SECRET,
    });

    return Response.json(createSuccessResponse(result));
  } catch {
    return Response.json(createErrorResponse("PAYMENT_FAILED", "Payment webhook could not be processed"), { status: 400 });
  }
}
