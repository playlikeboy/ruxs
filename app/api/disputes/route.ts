import { DisputeService } from "@/src/modules/disputes/dispute-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, assertSelf, assertTenant, requireRole } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const p = new URL(request.url).searchParams;
    const tenantId = p.get("tenantId");
    const customerId = p.get("customerId");
    const status = p.get("status") || undefined;

    if (tenantId) {
      if (session.role === "PLATFORM_ADMIN") return Response.json(createSuccessResponse(await DisputeService.listByTenantAsync(tenantId, status)), { headers: { "Cache-Control": "private, no-store" }});
      assertTenant(session, tenantId);
      requireRole(session, ["VENDOR_ADMIN"]);
      return Response.json(createSuccessResponse(await DisputeService.listByTenantAsync(tenantId, status)), { headers: { "Cache-Control": "private, no-store" }});
    }
    if (customerId) {
      assertSelf(session, customerId);
      return Response.json(createSuccessResponse(await DisputeService.listByCustomerAsync(customerId)), { headers: { "Cache-Control": "private, no-store" }});
    }
    if (session.role === "PLATFORM_ADMIN") return Response.json(createSuccessResponse(await DisputeService.listAllAsync(status)));
    return Response.json(createErrorResponse("VALIDATION_FAILED", "tenantId or customerId is required"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load disputes"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;
    const dispute = await DisputeService.fileDisputeAsync({ ...body, customerId: session.sub });
    return Response.json(createSuccessResponse(dispute), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to file dispute"), { status: 500 });
  }
}
