import { BillingEngine } from "@/src/modules/billing/billing-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertSelf, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const tenantId = searchParams.get("tenantId");
    if (customerId) {
      assertSelf(session, customerId);
      return Response.json(createSuccessResponse(await BillingEngine.listByCustomer(customerId)), { headers: { "Cache-Control": "private, no-store" }});
    }
    if (tenantId) {
      requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
      if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
      return Response.json(createSuccessResponse(await BillingEngine.listByTenant(tenantId)), { headers: { "Cache-Control": "private, no-store" }});
    }
    return Response.json(createErrorResponse("VALIDATION_FAILED", "customerId or tenantId is required"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load invoices"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;
    if (session.role === "VENDOR_ADMIN") assertTenant(session, String(body.tenantId));
    return Response.json(createSuccessResponse(await BillingEngine.generateInvoice(body)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to generate invoice"), { status: 500 });
  }
}
