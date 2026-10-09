import { NotificationService } from "@/src/modules/notifications/notification-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, assertSelf } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const customerId = new URL(request.url).searchParams.get("customerId");
    if (!customerId) return Response.json(createErrorResponse("VALIDATION_FAILED", "customerId is required"), { status: 400 });
    assertSelf(session, customerId);
    return Response.json(createSuccessResponse(await NotificationService.getFeedForCustomerAsync(session.sub)), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load notifications"), { status: 500 });
  }
}
