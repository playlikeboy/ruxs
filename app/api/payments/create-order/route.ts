import { PaymentService } from "@/src/modules/payments/payment-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, assertSelf, assertCustomerAccess } from "@/src/shared/auth/request";
import { BillingEngine } from "@/src/modules/billing/billing-engine";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const customerId = session.sub;
    if (body.customerId && body.customerId !== customerId) {
      return Response.json(createErrorResponse("FORBIDDEN", "Customer identity must come from the session"), { status: 403 });
    }

    if (!body.invoiceId) {
      return Response.json(createErrorResponse("VALIDATION_FAILED", "invoiceId is required for payment orders"), { status: 400 });
    }

    const invoice = await BillingEngine.getById(String(body.invoiceId));
    if (!invoice) return Response.json(createErrorResponse("NOT_FOUND", "Invoice not found"), { status: 404 });
    assertCustomerAccess(session, invoice.customerId, invoice.tenantId);

    const remaining = Math.max(0, invoice.totalAmountDuePaise - invoice.amountPaidPaise);
    if (remaining <= 0) return Response.json(createErrorResponse("CONFLICT", "Invoice is already paid"), { status: 409 });

    const order = await PaymentService.createPaymentOrder({
      ...body,
      tenantId: invoice.tenantId,
      customerId,
      amountPaise: remaining,
    });

    return Response.json(createSuccessResponse(order), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create payment order"), { status: 500 });
  }
}
