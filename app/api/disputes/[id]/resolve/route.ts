import { DisputeService } from "@/src/modules/disputes/dispute-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession, requireRole } from "@/src/shared/auth/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, ["PLATFORM_ADMIN"]);
    const { id } = await params;
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;
    const result = await DisputeService.resolveDisputeAsync(id, { ...body, resolvedBy: session.sub });
    return Response.json(createSuccessResponse(result));
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to resolve dispute"), { status: 500 });
  }
}
