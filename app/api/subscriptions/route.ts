import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, assertSelf, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const tenantId = searchParams.get("tenantId");

    if (customerId) {
      assertSelf(session, customerId);
      return Response.json(createSuccessResponse(await SubscriptionEngine.listByCustomer(session.sub)), { headers: { "Cache-Control": "private, no-store" }});
    }
    if (tenantId) {
      assertTenant(session, tenantId);
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
    const body = await request.json();
    const sub = await SubscriptionEngine.createSubscription({ ...body, customerId: session.sub });
    if (session.role !== "PLATFORM_ADMIN" && session.role !== "VENDOR_ADMIN") return Response.json(createErrorResponse("FORBIDDEN", "Only authorized service accounts can create subscriptions"), { status: 403 });
    if (session.role === "VENDOR_ADMIN") assertTenant(session, sub.tenantId);
    return Response.json(createSuccessResponse(sub), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create subscription"), { status: 500 });
  }
}
