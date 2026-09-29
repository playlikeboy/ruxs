import { VendorService } from "@/src/modules/vendor/vendor-service";
import { AdminService } from "@/src/modules/admin/admin-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const tenantId = searchParams.get("tenantId") || searchParams.get("id");

    const adminVendors = await AdminService.listVendorsAsync();
    const defaultVendor = adminVendors[0];
    const identifier = slug || tenantId || defaultVendor?.slug || defaultVendor?.id;

    if (!identifier) {
      return Response.json(createErrorResponse("NOT_FOUND", "No vendors found in system"), { status: 404 });
    }

    // 1. Try VendorService
    let vendor = await VendorService.getVendorBySlug(identifier);
    if (!vendor && tenantId) {
      vendor = await VendorService.getVendorById(tenantId);
    }

    // 2. If not found, check AdminService list
    if (!vendor) {
      const match = adminVendors.find((v) => v.slug === identifier || v.id === identifier);
      if (match) {
        vendor = {
          id: match.id,
          businessName: match.businessName,
          slug: match.slug,
          phone: match.phone,
          upiId: "merchant@upi",
          vendorType: match.vendorType || "TIFFIN",
          primaryCategory: match.vendorType === "MILKMAN" ? "MILK" : match.vendorType === "WATER_SERVICE" ? "WATER" : "TIFFIN",
          typeConfig: match.typeConfig || {},
          locality: "Bengaluru",
          city: "Bengaluru",
          coveredSocieties: match.coveredSocieties,
          inviteUrl: `https://ruxs.in/v/${match.slug}`,
          qrPayload: `upi://pay?pa=merchant@upi&pn=${encodeURIComponent(match.businessName)}&cu=INR`,
          status: (match.status === "PENDING_VERIFICATION" ? "PENDING_APPROVAL" : match.status) as any,
          createdAt: match.createdAt,
        };
      }
    }

    if (!vendor) {
      return Response.json(createErrorResponse("NOT_FOUND", "Vendor profile not found"), { status: 404 });
    }

    return Response.json(createSuccessResponse(vendor));
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Failed to load vendor profile"
      ),
      { status: 500 }
    );
  }
}
