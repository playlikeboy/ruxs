import { FulfillmentStateMachine } from "@/src/modules/fulfillment/fulfillment-fsm";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, assertCustomerAccess, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const p = new URL(request.url).searchParams;
    const tenantId = p.get("tenantId");
    const date = p.get("date");
    const customerId = p.get("customerId");

    if (tenantId && date) {
      if (session.role === "PLATFORM_ADMIN" || session.role === "VENDOR_ADMIN") {
        if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
      } else if (session.role === "DELIVERY_STAFF") {
        assertTenant(session, tenantId);
      } else {
        return Response.json(createErrorResponse("FORBIDDEN", "Tenant fulfillment views are restricted"), { status: 403 });
      }
      return Response.json(createSuccessResponse(await FulfillmentStateMachine.listByTenantAndDateAsync(tenantId, date)), { headers: { "Cache-Control": "private, no-store" }});
    }

    if (customerId) {
      assertCustomerAccess(session, customerId);
      return Response.json(createSuccessResponse(await FulfillmentStateMachine.listByCustomerAsync(customerId)), { headers: { "Cache-Control": "private, no-store" }});
    }

    return Response.json(createErrorResponse("VALIDATION_FAILED", "Must provide tenantId + date, or customerId"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load fulfillments"), { status: 500 });
  }
}
