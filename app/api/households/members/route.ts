import { HouseholdService } from "@/src/modules/households/household-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession } from "@/src/shared/auth/request";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const result = await HouseholdService.inviteMemberAsync({ ...body, invitedByUserId: session.sub });
    return Response.json(createSuccessResponse(result), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to invite household member"), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const params = new URL(request.url).searchParams;
    const householdId = params.get("householdId");
    const memberUserId = params.get("memberUserId");
    if (!householdId || !memberUserId) return Response.json(createErrorResponse("VALIDATION_FAILED", "householdId and memberUserId are required"), { status: 400 });
    const household = await HouseholdService.getHouseholdAsync(householdId);
    const actor = household?.members.find((m) => m.userId === session.sub);
    if (!actor || !["PRIMARY_OWNER", "ADMIN"].includes(actor.role)) {
      return Response.json(createErrorResponse("FORBIDDEN", "Only household owners or admins may remove members"), { status: 403 });
    }
    return Response.json(createSuccessResponse(await HouseholdService.removeMemberAsync(householdId, memberUserId, session.sub)));
  } catch {
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to remove household member"), { status: 500 });
  }
}
