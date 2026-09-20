import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { z, ZodError } from "zod";

const VendorActionSchema = z.object({
  vendorId: z.string().optional(),
  action: z.enum(["VERIFY", "APPROVE", "SUSPEND", "CHANGE_TIER", "PROVISION_DIRECT", "GENERATE_CREDENTIALS"]),
  tier: z.enum(["STARTER", "GROWTH", "PRO"]).optional(),
  reason: z.string().optional(),
  adminUser: z.object({
    userId: z.string(),
    email: z.string(),
  }),
  // For PROVISION_DIRECT
  directProvision: z
    .object({
      businessName: z.string().min(3),
      phone: z.string().min(10),
      vendorType: z.enum(["MILKMAN", "WATER_SERVICE", "TIFFIN"]),
      locality: z.string().min(2),
      city: z.string().optional(),
      coveredSocieties: z.array(z.string()).min(1),
      upiId: z.string().optional(),
      tier: z.enum(["STARTER", "GROWTH", "PRO"]).optional(),
      typeConfig: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const status = searchParams.get("status") || undefined;

    if (slug) {
      const detail = await AdminService.getVendorDetailBySlug(slug);
      if (!detail) {
        return Response.json(createErrorResponse("NOT_FOUND", `Vendor '${slug}' not found`), {
          status: 404,
        });
      }
      return Response.json(createSuccessResponse(detail));
    }

    const vendors = await AdminService.listVendorsAsync(status);
    return Response.json(createSuccessResponse(vendors));
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Failed to load vendors"
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = VendorActionSchema.parse(body);

    if (validated.action === "VERIFY" || validated.action === "APPROVE") {
      if (!validated.vendorId) {
        return Response.json(
          createErrorResponse("VALIDATION_FAILED", "vendorId is required for approval"),
          { status: 400 }
        );
      }
      const vendor = AdminService.verifyVendor(validated.vendorId, validated.adminUser);
      return Response.json(createSuccessResponse(vendor));
    } else if (validated.action === "SUSPEND") {
      if (!validated.vendorId || !validated.reason) {
        return Response.json(
          createErrorResponse("VALIDATION_FAILED", "vendorId and reason are required for suspension"),
          { status: 400 }
        );
      }
      const vendor = AdminService.suspendVendor(
        validated.vendorId,
        validated.reason,
        validated.adminUser
      );
      return Response.json(createSuccessResponse(vendor));
    } else if (validated.action === "CHANGE_TIER") {
      if (!validated.vendorId || !validated.tier) {
        return Response.json(
          createErrorResponse("VALIDATION_FAILED", "vendorId and tier are required for CHANGE_TIER"),
          { status: 400 }
        );
      }
      const vendor = AdminService.updateVendorTier(
        validated.vendorId,
        validated.tier,
        validated.adminUser
      );
      return Response.json(createSuccessResponse(vendor));
    } else if (validated.action === "PROVISION_DIRECT") {
      if (!validated.directProvision) {
        return Response.json(
          createErrorResponse("VALIDATION_FAILED", "directProvision details required"),
          { status: 400 }
        );
      }
      const vendor = await AdminService.provisionVendorDirect(
        validated.directProvision,
        validated.adminUser
      );
      return Response.json(createSuccessResponse(vendor), { status: 201 });
    } else if (validated.action === "GENERATE_CREDENTIALS") {
      if (!validated.vendorId) {
        return Response.json(
          createErrorResponse("VALIDATION_FAILED", "vendorId is required for GENERATE_CREDENTIALS"),
          { status: 400 }
        );
      }
      const creds = AdminService.generateCredentials(validated.vendorId, validated.adminUser);
      return Response.json(createSuccessResponse(creds));
    }

    return Response.json(createErrorResponse("VALIDATION_FAILED", "Unknown action"), {
      status: 400,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const msg = error.issues[0]?.message || "Validation failed";
      return Response.json(createErrorResponse("VALIDATION_FAILED", msg), { status: 400 });
    }
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Failed to execute admin action"
      ),
      { status: 400 }
    );
  }
}
