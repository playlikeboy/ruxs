import { ExpenseSplitter } from "@/src/modules/expenses/expense-splitter";
import { HouseholdService } from "@/src/modules/households/household-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let householdId = searchParams.get("householdId");
  const userId = searchParams.get("userId");

  if (!householdId && userId) {
    const userHousehold = await HouseholdService.getHouseholdForUserAsync(userId);
    if (userHousehold) {
      householdId = userHousehold.id;
    }
  }

  if (!householdId) {
    householdId = "hh_sobha_b402";
  }

  const list = await ExpenseSplitter.listByHouseholdAsync(householdId);
  return Response.json(createSuccessResponse(list));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const expense = ExpenseSplitter.createExpense(body);
    return Response.json(createSuccessResponse(expense), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const msg = error.issues[0]?.message || "Validation failed";
      return Response.json(createErrorResponse("VALIDATION_FAILED", msg), { status: 400 });
    }
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Internal Server Error"
      ),
      { status: 400 }
    );
  }
}
