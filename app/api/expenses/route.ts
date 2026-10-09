import { ExpenseSplitter } from "@/src/modules/expenses/expense-splitter";
import { HouseholdService } from "@/src/modules/households/household-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";
import { requireSession } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const requested = new URL(request.url).searchParams.get("householdId");
    let householdId = requested;
    if (householdId) {
      const household = await HouseholdService.getHouseholdAsync(householdId);
      if (!household || !household.members.some((m) => m.userId === session.sub)) return Response.json(createErrorResponse("FORBIDDEN", "You may only access your household expenses"), { status: 403 });
    } else {
      householdId = (await HouseholdService.getHouseholdForUserAsync(session.sub))?.id || null;
    }
    if (!householdId) return Response.json(createErrorResponse("NOT_FOUND", "No household found for this user"), { status: 404 });
    return Response.json(createSuccessResponse(await ExpenseSplitter.listByHouseholdAsync(householdId)), { headers: { "Cache-Control": "private, no-store" }});
  } catch {
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load household expenses"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const household = await HouseholdService.getHouseholdForUserAsync(session.sub);
    if (!household || !household.members.some((m) => m.userId === session.sub)) return Response.json(createErrorResponse("FORBIDDEN", "You must belong to a household"), { status: 403 });
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, any>;
    const expense = await ExpenseSplitter.createExpenseAsync({ ...body, householdId: household.id, paidByUserId: session.sub });
    return Response.json(createSuccessResponse(expense), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to create expense"), { status: 500 });
  }
}
