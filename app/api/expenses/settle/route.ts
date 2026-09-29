import { ExpenseSplitter } from "@/src/modules/expenses/expense-splitter";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { z, ZodError } from "zod";
import { requireSession } from "@/src/shared/auth/request";

const SettleDebtSchema = z.object({ expenseId: z.string().min(1), participantUserId: z.string().min(1).optional() });

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = SettleDebtSchema.parse(await request.json());
    if (input.participantUserId && input.participantUserId !== session.sub) return Response.json(createErrorResponse("FORBIDDEN", "You may only settle your own debt"), { status: 403 });
    return Response.json(createSuccessResponse(ExpenseSplitter.settleParticipantDebtAsync(input.expenseId, session.sub)));
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to settle expense debt"), { status: 500 });
  }
}
