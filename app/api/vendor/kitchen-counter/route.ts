import { CutoffEngine } from "@/src/modules/cutoff/cutoff-engine";
import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    const slug = searchParams.get("slug");
    if (slug) {
      const detail = await AdminService.getVendorDetailBySlug(slug);
      if (detail?.vendor) tenantId = detail.vendor.id;
    }
  }
  if (!tenantId) {
    const allVendors = await AdminService.listVendorsAsync();
    tenantId = allVendors[0]?.id || "ten_sharma_tiffin";
  }
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const shift = searchParams.get("shift") || "LUNCH";

  const counter = await CutoffEngine.getKitchenBatchCounterAsync(tenantId, date, shift);
  return Response.json(createSuccessResponse(counter));
}
