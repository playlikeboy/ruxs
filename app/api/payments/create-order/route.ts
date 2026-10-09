import { PaymentService } from "@/src/modules/payments/payment-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, assertCustomerAccess } from "@/src/shared/auth/request";
import { BillingEngine } from "@/src/modules/billing/billing-engine";
import { db, isTestEnv, tenants } from "@/src/shared/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;

    if (body.customerId && body.customerId !== session.sub) {
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

    let recipientUpiId = String(body.recipientUpiId || "");
    let recipientName = String(body.recipientName || "");

    if (!isTestEnv) {
      const vendorRows = await db.select({
        upiId: tenants.upiId,
        businessName: tenants.businessName,
      }).from(tenants).where(eq(tenants.id, invoice.tenantId)).limit(1);
      const vendor = vendorRows[0];
      if (!vendor?.upiId) return Response.json(createErrorResponse("CONFLICT", "Vendor payment details are not configured"), { status: 409 });
      recipientUpiId = vendor.upiId;
      recipientName = vendor.businessName;
    }

    if (!recipientUpiId || !recipientName) {
      return Response.json(createErrorResponse("VALIDATION_FAILED", "Vendor payment details are required"), { status: 400 });
    }

    const order = await PaymentService.createPaymentOrder({
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      customerId: session.sub,
      amountPaise: remaining,
      recipientUpiId,
      recipientName,
    });

    return Response.json(createSuccessResponse(order), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create payment order"), { status: 500 });
  }
}
