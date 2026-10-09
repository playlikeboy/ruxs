import { VacationService } from "@/src/modules/vacation/vacation-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession } from "@/src/shared/auth/request";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;
    return Response.json(createSuccessResponse(await VacationService.createVacation({ ...body, customerId: session.sub })), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create vacation pause"), { status: 500 });
  }
}
