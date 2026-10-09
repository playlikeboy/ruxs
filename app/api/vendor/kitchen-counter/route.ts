import { CutoffEngine } from "@/src/modules/cutoff/cutoff-engine";
import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const { searchParams } = new URL(request.url);
    let tenantId: string | null = searchParams.get("tenantId");
    if (!tenantId && session.role === "VENDOR_ADMIN") tenantId = session.tenantId || null;
    if (!tenantId && session.role === "PLATFORM_ADMIN") tenantId = (await AdminService.listVendorsAsync())[0]?.id || null;
    if (!tenantId) return Response.json(createErrorResponse("NOT_FOUND", "No vendor found"), { status: 404 });
    if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const shift = searchParams.get("shift") || "LUNCH";
    return Response.json(createSuccessResponse(await CutoffEngine.getKitchenBatchCounterAsync(tenantId, date, shift)), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load kitchen counter"), { status: 500 });
  }
}
