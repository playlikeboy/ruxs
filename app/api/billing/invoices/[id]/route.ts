import { BillingEngine } from "@/src/modules/billing/billing-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, assertSelf, requireRole, assertTenant } from "@/src/shared/auth/request";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const invoice = await BillingEngine.getById(id);
    if (!invoice) return Response.json(createErrorResponse("NOT_FOUND", "Invoice not found"), { status: 404 });
    if (session.role === "VENDOR_ADMIN") assertTenant(session, invoice.tenantId);
    else if (session.role === "PLATFORM_ADMIN") requireRole(session, ["PLATFORM_ADMIN"]);
    else assertSelf(session, invoice.customerId);
    return Response.json(createSuccessResponse(invoice), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load invoice"), { status: 500 });
  }
}
