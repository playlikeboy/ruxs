import { HouseholdService } from "@/src/modules/households/household-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const householdId = new URL(request.url).searchParams.get("householdId");
    const household = householdId
      ? await HouseholdService.getHouseholdAsync(householdId)
      : await HouseholdService.getHouseholdForUserAsync(session.sub);

    if (!household) return Response.json(createErrorResponse("NOT_FOUND", "Household not found"), { status: 404 });
    if (session.role !== "PLATFORM_ADMIN" && !household.members.some((m) => m.userId === session.sub)) {
      return Response.json(createErrorResponse("FORBIDDEN", "You are not a member of this household"), { status: 403 });
    }
    return Response.json(createSuccessResponse(household), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load household"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const household = HouseholdService.createHousehold({ ...body, primaryOwnerId: session.sub });
    return Response.json(createSuccessResponse(household), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create household"), { status: 500 });
  }
}
