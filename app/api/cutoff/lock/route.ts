import { CutoffEngine } from "@/src/modules/cutoff/cutoff-engine";
import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      tenantId?: string;
      serviceDate?: string;
      evaluationTime?: string;
    };

    const requestedTenantId = body.tenantId;
    const serviceDate = body.serviceDate || new Date().toISOString().split("T")[0];

    if (!requestedTenantId || requestedTenantId === "ALL") {
      const allTenants = await AdminService.listVendorsAsync();
      let totalLocked = 0;
      const allUpdated: any[] = [];

      for (const t of allTenants) {
        const res = CutoffEngine.lockExpiredCutoffs(t.id, serviceDate, body.evaluationTime);
        totalLocked += res.lockedCount;
        allUpdated.push(...res.updatedFulfillments);
      }

      return Response.json(createSuccessResponse({ lockedCount: totalLocked, updatedFulfillments: allUpdated }));
    }

    const result = CutoffEngine.lockExpiredCutoffs(
      requestedTenantId,
      serviceDate,
      body.evaluationTime
    );

    return Response.json(createSuccessResponse(result));
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Internal Server Error"
      ),
      { status: 500 }
    );
  }
}
