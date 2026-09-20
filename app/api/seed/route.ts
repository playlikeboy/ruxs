import { seedDatabase } from "@/src/shared/db/seed";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

export async function POST(request: Request) {
  try {
    const result = await seedDatabase(true);
    return Response.json(createSuccessResponse(result));
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Failed to seed database"
      ),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const result = await seedDatabase(false);
    return Response.json(createSuccessResponse(result));
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Failed to seed database"
      ),
      { status: 500 }
    );
  }
}
