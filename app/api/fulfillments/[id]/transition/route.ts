import { FulfillmentStateMachine } from "@/src/modules/fulfillment/fulfillment-fsm";
import { TransitionActionSchema } from "@/src/modules/fulfillment/fulfillment-schema";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole, assertTenant, assertSelf } from "@/src/shared/auth/request";

const allowedActions: Record<string, string[]> = {
  CUSTOMER: ["CONFIRM", "SKIP", "DISPUTE"],
  HOUSEHOLD_MEMBER: ["CONFIRM", "SKIP", "DISPUTE"],
  DELIVERY_STAFF: ["DISPATCH", "MARK_DELIVERED", "MARK_FAILED"],
  VENDOR_ADMIN: ["REQUEST_CONFIRMATION", "CONFIRM", "START_PREP", "DISPATCH", "CANCEL"],
  PLATFORM_ADMIN: [
    "REQUEST_CONFIRMATION", "CONFIRM", "SKIP", "START_PREP", "DISPATCH",
    "MARK_DELIVERED", "MARK_FAILED", "DISPUTE", "CANCEL",
  ],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, ["CUSTOMER", "HOUSEHOLD_MEMBER", "DELIVERY_STAFF", "VENDOR_ADMIN", "PLATFORM_ADMIN"]);

    const { id } = await params;
    const fulfillment = await FulfillmentStateMachine.getByIdAsync(id);
    if (!fulfillment) return Response.json(createErrorResponse("NOT_FOUND", "Fulfillment not found"), { status: 404 });

    const action = TransitionActionSchema.parse(await request.json());
    if (!allowedActions[session.role]?.includes(action.action)) {
      return Response.json(createErrorResponse("FORBIDDEN", "This role cannot perform that fulfillment action"), { status: 403 });
    }

    if (session.role === "CUSTOMER" || session.role === "HOUSEHOLD_MEMBER") {
      assertSelf(session, fulfillment.customerId);
      if (action.action === "DISPUTE" && !action.notes) {
        return Response.json(createErrorResponse("VALIDATION_FAILED", "Dispute notes are required"), { status: 400 });
      }
    } else if (session.role === "VENDOR_ADMIN") {
      assertTenant(session, fulfillment.tenantId);
    } else if (session.role === "DELIVERY_STAFF") {
      if (fulfillment.tenantId !== session.tenantId) return Response.json(createErrorResponse("FORBIDDEN", "Fulfillment belongs to another tenant"), { status: 403 });
      if (action.action === "DISPATCH" || action.action === "MARK_DELIVERED" || action.action === "MARK_FAILED") {
        if (action.driverId && action.driverId !== session.sub) {
          return Response.json(createErrorResponse("FORBIDDEN", "Driver identity must match the session"), { status: 403 });
        }
      }
    }

    const effectiveAction =
      session.role === "DELIVERY_STAFF"
        ? { ...action, driverId: session.sub }
        : action;

    return Response.json(createSuccessResponse(FulfillmentStateMachine.transitionAsync(fulfillment, effectiveAction)));
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") {
      return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    }
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to transition fulfillment"), { status: 500 });
  }
}
