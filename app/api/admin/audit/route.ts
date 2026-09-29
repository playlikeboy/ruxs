import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, requireRole } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["PLATFORM_ADMIN"]);
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") || 50);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 50;
    return Response.json(createSuccessResponse(await AdminService.getAuditLogsAsync(limit)));
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") {
      return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    }
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load audit logs"), { status: 500 });
  }
}
