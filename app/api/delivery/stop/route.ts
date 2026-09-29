import { DeliveryEngine } from "@/src/modules/delivery/delivery-engine";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { z, ZodError } from "zod";
import { requireSession, requireRole } from "@/src/shared/auth/request";

const StopActionSchema = z.object({
  runId: z.string().min(1),
  stopId: z.string().min(1),
  action: z.enum(["DELIVER", "FAIL"]),
  assetCollected: z.number().int().nonnegative().max(100).optional(),
  assetDelivered: z.number().int().nonnegative().max(100).optional(),
  failureReason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["DELIVERY_STAFF", "VENDOR_ADMIN", "PLATFORM_ADMIN"]);
    const validated = StopActionSchema.parse(await request.json());
    const run = await DeliveryEngine.getRunSheetAsync(validated.runId);
    if (!run) return Response.json(createErrorResponse("NOT_FOUND", "Delivery run not found"), { status: 404 });
    if (session.role === "DELIVERY_STAFF" && run.driverId !== session.sub) return Response.json(createErrorResponse("FORBIDDEN", "This run does not belong to you"), { status: 403 });
    if (session.role === "VENDOR_ADMIN" && run.tenantId !== session.tenantId) return Response.json(createErrorResponse("FORBIDDEN", "Run belongs to another tenant"), { status: 403 });
    if (!run.stops.some((s) => s.id === validated.stopId)) return Response.json(createErrorResponse("NOT_FOUND", "Delivery stop not found"), { status: 404 });

    if (validated.action === "DELIVER") {
      return Response.json(createSuccessResponse(await DeliveryEngine.completeStop({
        runId: validated.runId, stopId: validated.stopId, assetCollected: validated.assetCollected,
        assetDelivered: validated.assetDelivered, notes: validated.notes,
      })));
    }
    if (!validated.failureReason) return Response.json(createErrorResponse("VALIDATION_FAILED", "failureReason is required when action is FAIL"), { status: 400 });
    return Response.json(createSuccessResponse(DeliveryEngine.failStop({
      runId: validated.runId, stopId: validated.stopId, failureReason: validated.failureReason,
    })));
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to update delivery stop"), { status: 500 });
  }
}