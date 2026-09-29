import { CutoffEngine } from "@/src/modules/cutoff/cutoff-engine";
import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const body = await request.json() as { tenantId?: string; serviceDate?: string; evaluationTime?: string };
    const serviceDate = body.serviceDate || new Date().toISOString().split("T")[0];
    const tenantId = body.tenantId;
    if (!tenantId || tenantId === "ALL") {
      if (session.role !== "PLATFORM_ADMIN") return Response.json(createErrorResponse("FORBIDDEN", "Only platform administrators can lock all tenants"), { status: 403 });
      const all = await AdminService.listVendorsAsync();
      const updated = all.map(t => CutoffEngine.lockExpiredCutoffs(t.id, serviceDate, body.evaluationTime)).flatMap(r => r.updatedFulfillments);
      return Response.json(createSuccessResponse({ lockedCount: updated.length, updatedFulfillments: updated }));
    }
    assertTenant(session, tenantId);
    return Response.json(createSuccessResponse(CutoffEngine.lockExpiredCutoffs(tenantId, serviceDate, body.evaluationTime)));
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to lock cutoff"), { status: 500 });
  }
}