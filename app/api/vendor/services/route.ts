import { ServiceCatalogManager } from "@/src/modules/services/service-catalog";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const tenantId = new URL(request.url).searchParams.get("tenantId");
    if (!tenantId) return Response.json(createErrorResponse("VALIDATION_FAILED", "Missing tenantId query parameter"), { status: 400 });
    if (session.role === "VENDOR_ADMIN") assertTenant(session, tenantId);
    return Response.json(createSuccessResponse(await ServiceCatalogManager.listServicesByTenant(tenantId)), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load services"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const body = await request.json();
    if (session.role === "VENDOR_ADMIN") assertTenant(session, String(body.tenantId));
    return Response.json(createSuccessResponse(await ServiceCatalogManager.createService(body)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create service"), { status: 500 });
  }
}
