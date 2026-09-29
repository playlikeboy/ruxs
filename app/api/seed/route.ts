import { seedDatabase } from "@/src/shared/db/seed";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, requireRole } from "@/src/shared/auth/request";

async function assertSeedAccess() {
  if (process.env.NODE_ENV === "test") return;
  const session = await requireSession();
  requireRole(session, ["PLATFORM_ADMIN"]);
}

export async function POST() {
  try {
    await assertSeedAccess();
    return Response.json(createSuccessResponse(await seedDatabase(true)));
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to seed database"), { status: 500 });
  }
}

export async function GET() {
  try {
    await assertSeedAccess();
    return Response.json(createSuccessResponse(await seedDatabase(false)));
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to seed database"), { status: 500 });
  }
}
