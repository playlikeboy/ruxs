import { NotificationService } from "@/src/modules/notifications/notification-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const body = await request.json();
    if (session.role === "VENDOR_ADMIN") assertTenant(session, String(body.tenantId));
    return Response.json(createSuccessResponse(await NotificationService.dispatchNotification(body)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Notification dispatch failed"), { status: 500 });
  }
}
