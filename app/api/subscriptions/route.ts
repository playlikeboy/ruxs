import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const tenantId = searchParams.get("tenantId");

    if (customerId) {
      if (session.role !== "PLATFORM_ADMIN") {
        if (session.sub !== customerId) return Response.json(createErrorResponse("FORBIDDEN", "You may only access your own subscriptions"), { status: 403 });
      }
      return Response.json(createSuccessResponse(await SubscriptionEngine.listByCustomer(customerId)), { headers: { "Cache-Control": "private, no-store" }});
    }
    if (tenantId) {
      requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
      if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
      return Response.json(createSuccessResponse(await SubscriptionEngine.listByTenant(tenantId)), { headers: { "Cache-Control": "private, no-store" }});
    }
    return Response.json(createErrorResponse("VALIDATION_FAILED", "Please provide customerId or tenantId"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load subscriptions"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["CUSTOMER", "HOUSEHOLD_MEMBER", "VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const body = await request.json();
    const sub = await SubscriptionEngine.createSubscription({ ...body, customerId: session.sub });
    if (session.role === "VENDOR_ADMIN") assertTenant(session, sub.tenantId);
    return Response.json(createSuccessResponse(sub), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create subscription"), { status: 500 });
  }
}
