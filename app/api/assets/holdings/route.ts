import { AssetLedgerService } from "@/src/modules/assets/asset-ledger";
import { AssetType } from "@/src/modules/assets/asset-schema";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { requireSession, assertCustomerAccess } from "@/src/shared/auth/request";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const params = new URL(request.url).searchParams;
    const tenantId = params.get("tenantId");
    const customerId = params.get("customerId");
    const assetType = (params.get("assetType") as AssetType) || "WATER_JAR_20L";
    if (!tenantId || !customerId) return Response.json(createErrorResponse("VALIDATION_FAILED", "tenantId and customerId are required"), { status: 400 });
    assertCustomerAccess(session, customerId, tenantId);
    return Response.json(createSuccessResponse(await AssetLedgerService.getHoldingAsync(tenantId, customerId, assetType)), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load asset holding"), { status: 500 });
  }
}