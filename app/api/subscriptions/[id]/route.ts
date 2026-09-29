import { SubscriptionEngine } from "@/src/modules/subscriptions/subscription-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, assertSelf, assertTenant } from "@/src/shared/auth/request";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const sub = await SubscriptionEngine.getById(id);
    if (!sub) return Response.json(createErrorResponse("NOT_FOUND", "Subscription not found"), { status: 404 });

    if (session.role === "VENDOR_ADMIN") assertTenant(session, sub.tenantId);
    else assertSelf(session, sub.customerId);

    const body = await request.json() as { action?: "pause" | "resume" | "cancel" };
    if (body.action === "pause") return Response.json(createSuccessResponse(await SubscriptionEngine.pauseSubscription(id)));
    if (body.action === "resume") return Response.json(createSuccessResponse(await SubscriptionEngine.resumeSubscription(id)));
    if (body.action === "cancel") return Response.json(createSuccessResponse(await SubscriptionEngine.cancelSubscription(id)));
    return Response.json(createErrorResponse("VALIDATION_FAILED", "Action must be pause, resume, or cancel"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to update subscription"), { status: 500 });
  }
}
