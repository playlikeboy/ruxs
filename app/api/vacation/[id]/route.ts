import { VacationService } from "@/src/modules/vacation/vacation-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession } from "@/src/shared/auth/request";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const mine = (await VacationService.listByCustomerAsync(session.sub)).find((v) => v.id === id);
    if (!mine) return Response.json(createErrorResponse("FORBIDDEN", "This vacation pause does not belong to you"), { status: 403 });

    const body = await request.json() as { action?: "resume_early" | "extend"; newEndDate?: string };
    if (body.action === "resume_early") return Response.json(createSuccessResponse(await VacationService.resumeEarly(id)));
    if (body.action === "extend" && body.newEndDate) return Response.json(createSuccessResponse(await VacationService.extendVacation(id, body.newEndDate)));
    return Response.json(createErrorResponse("VALIDATION_FAILED", "Invalid vacation action"), { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to update vacation"), { status: 500 });
  }
}
