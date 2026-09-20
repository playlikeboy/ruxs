import { DeliveryEngine } from "@/src/modules/delivery/delivery-engine";
import { GenerateRunSheetInputSchema } from "@/src/modules/delivery/delivery-schema";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const driverId = searchParams.get("driverId") || undefined;
  const tenantId = searchParams.get("tenantId") || undefined;
  const shift = searchParams.get("shift") || undefined;
  const list = searchParams.get("list") === "true";

  if (list) {
    const runs = await DeliveryEngine.listRunsAsync({ tenantId, driverId, shift });
    return Response.json(createSuccessResponse(runs));
  }

  if (runId) {
    const run = await DeliveryEngine.getRunSheetAsync(runId);
    if (!run) {
      return Response.json(
        createErrorResponse("NOT_FOUND", `Run sheet ${runId} not found`),
        { status: 404 }
      );
    }
    return Response.json(createSuccessResponse(run));
  }

  // If no runId passed, load latest active run for driver/tenant
  const latestRun = await DeliveryEngine.getLatestRunAsync({ tenantId, driverId });
  if (!latestRun) {
    return Response.json(
      createErrorResponse("NOT_FOUND", "No active delivery runs found"),
      { status: 404 }
    );
  }

  return Response.json(createSuccessResponse(latestRun));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = GenerateRunSheetInputSchema.parse(body);
    const run = DeliveryEngine.generateRunSheet(validated);
    return Response.json(createSuccessResponse(run), { status: 201 });
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
      { status: 500 }
    );
  }
}
