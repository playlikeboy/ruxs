import { CustomerService } from "@/src/modules/customer/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole } from "@/src/shared/auth/request";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["CUSTOMER", "HOUSEHOLD_MEMBER"]);
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;
    const customer = await CustomerService.onboardCustomer(
      { ...body, phone: session.phone },
      { userId: session.sub }
    );
    return Response.json(createSuccessResponse(customer), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to onboard customer"), { status: 500 });
  }
}
