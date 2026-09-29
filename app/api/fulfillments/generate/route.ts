import { FulfillmentGenerator } from "@/src/modules/fulfillment/fulfillment-generator";
import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";
import { VacationService } from "@/src/modules/vacation/vacation-service";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const body = await request.json() as { tenantId?: string; serviceDate?: string; cutoffTimeStr?: string };
    const serviceDate = body.serviceDate || new Date().toISOString().split("T")[0];
    const requestedTenantId = body.tenantId;
    await VacationService.hydrate();

    if (!requestedTenantId || requestedTenantId === "ALL") {
      if (session.role !== "PLATFORM_ADMIN") return Response.json(createErrorResponse("FORBIDDEN", "Only platform administrators can generate fulfillments for all tenants"), { status: 403 });
      return Response.json(createSuccessResponse(await FulfillmentGenerator.generateForDateAsync(await SubscriptionEngine.listAllAsync(), { serviceDate, cutoffTimeStr: body.cutoffTimeStr || "10:00", shift: "LUNCH" })), { status: 201 });
    }

    assertTenant(session, requestedTenantId);
    const subscriptions = await SubscriptionEngine.listByTenant(requestedTenantId);
    return Response.json(createSuccessResponse(await FulfillmentGenerator.generateForDateAsync(subscriptions, { serviceDate, cutoffTimeStr: body.cutoffTimeStr || "10:00", shift: "LUNCH" })), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to generate fulfillments"), { status: 500 });
  }
}
