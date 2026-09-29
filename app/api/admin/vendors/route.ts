import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { z, ZodError } from "zod";
import { requireSession, requireRole } from "@/src/shared/auth/request";

const VendorActionSchema = z.object({
  vendorId: z.string().min(1).optional(),
  action: z.enum(["VERIFY", "APPROVE", "SUSPEND", "CHANGE_TIER", "PROVISION_DIRECT", "GENERATE_CREDENTIALS"]),
  tier: z.enum(["STARTER", "GROWTH", "PRO"]).optional(),
  reason: z.string().min(1).max(500).optional(),
  directProvision: z.object({
    businessName: z.string().min(3).max(255),
    phone: z.string().min(10).max(20),
    vendorType: z.enum(["MILKMAN", "WATER_SERVICE", "TIFFIN"]),
    locality: z.string().min(2).max(255),
    city: z.string().max(100).optional(),
    coveredSocieties: z.array(z.string().min(1).max(255)).min(1).max(100),
    upiId: z.string().max(100).optional(),
    tier: z.enum(["STARTER", "GROWTH", "PRO"]).optional(),
    typeConfig: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["PLATFORM_ADMIN"]);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const status = searchParams.get("status") || undefined;
    if (slug) {
      const detail = await AdminService.getVendorDetailBySlug(slug);
      if (!detail) return Response.json(createErrorResponse("NOT_FOUND", "Vendor not found"), { status: 404 });
      return Response.json(createSuccessResponse(detail), { headers: { "Cache-Control": "private, no-store" }});
    }
    return Response.json(createSuccessResponse(await AdminService.listVendorsAsync(status)), { headers: { "Cache-Control": "private, no-store" }});
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to load vendors"), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["PLATFORM_ADMIN"]);
    const validated = VendorActionSchema.parse(await request.json());
    const adminUser = { userId: session.sub, email: session.phone };

    if (validated.action === "VERIFY" || validated.action === "APPROVE") {
      if (!validated.vendorId) return Response.json(createErrorResponse("VALIDATION_FAILED", "vendorId is required"), { status: 400 });
      return Response.json(createSuccessResponse(AdminService.verifyVendor(validated.vendorId, adminUser)));
    }
    if (validated.action === "SUSPEND") {
      if (!validated.vendorId || !validated.reason) return Response.json(createErrorResponse("VALIDATION_FAILED", "vendorId and reason are required"), { status: 400 });
      return Response.json(createSuccessResponse(AdminService.suspendVendor(validated.vendorId, validated.reason, adminUser)));
    }
    if (validated.action === "CHANGE_TIER") {
      if (!validated.vendorId || !validated.tier) return Response.json(createErrorResponse("VALIDATION_FAILED", "vendorId and tier are required"), { status: 400 });
      return Response.json(createSuccessResponse(await AdminService.updateVendorTierAsync(validated.vendorId, validated.tier, adminUser)));
    }
    if (validated.action === "PROVISION_DIRECT") {
      if (!validated.directProvision) return Response.json(createErrorResponse("VALIDATION_FAILED", "directProvision details required"), { status: 400 });
      return Response.json(createSuccessResponse(await AdminService.provisionVendorDirect(validated.directProvision, adminUser)), { status: 201 });
    }
    if (validated.action === "GENERATE_CREDENTIALS") {
      if (!validated.vendorId) return Response.json(createErrorResponse("VALIDATION_FAILED", "vendorId is required"), { status: 400 });
      return Response.json(createSuccessResponse(AdminService.generateCredentials(validated.vendorId, adminUser)));
    }
    return Response.json(createErrorResponse("VALIDATION_FAILED", "Unknown action"), { status: 400 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    if (error instanceof Error && error.name === "AuthorizationError") return Response.json(createErrorResponse((error as any).code, error.message), { status: (error as any).code === "UNAUTHORIZED" ? 401 : 403 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to execute admin action"), { status: 500 });
  }
}
