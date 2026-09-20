import { seedDatabase, SEEDED_VENDORS, SeededVendorData } from "@/src/shared/db/seed";
import { db, isTestEnv } from "@/src/shared/db";
import { tenants as tenantsTable } from "@/src/shared/db/schema";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "ALL"; // ALL, MILK, WATER, TIFFIN
    const shift = searchParams.get("shift") || "ALL"; // ALL, MORNING, AFTERNOON, EVENING, NIGHT
    const society = searchParams.get("society") || undefined;
    const forceSeed = searchParams.get("seed") === "true";

    // Ensure database is populated with verified baseline merchants
    await seedDatabase(forceSeed);

    let vendors: SeededVendorData[] = [];

    if (!isTestEnv) {
      try {
        const rows = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.status, "VERIFIED"));

        if (rows && rows.length > 0) {
          vendors = rows.map((r) => {
            let parsedConfig: any = {};
            try {
              if (r.typeConfig) parsedConfig = JSON.parse(r.typeConfig);
            } catch {}

            // Find matching seeded vendor for rich structure if needed
            const baseline = SEEDED_VENDORS.find((s) => s.id === r.id || s.slug === r.slug);

            return {
              id: r.id,
              businessName: r.businessName,
              slug: r.slug,
              phone: r.phone,
              email: r.email || "",
              upiId: r.upiId || "",
              fssaiNumber: r.fssaiNumber || "",
              planTier: (r.planTier as any) || "STARTER",
              vendorType: (r.vendorType as any) || baseline?.vendorType || "TIFFIN",
              status: (r.status as any) || "VERIFIED",
              locality: r.address ? r.address.split(",")[0] : baseline?.locality || "Bengaluru",
              city: r.address ? r.address.split(",")[1]?.trim() || "Bengaluru" : "Bengaluru",
              coveredSocieties: parsedConfig.coveredSocieties || baseline?.coveredSocieties || ["Sobha Classic", "Purva Fairmont"],
              rating: parsedConfig.rating ?? baseline?.rating ?? 4.8,
              reviewCount: parsedConfig.reviewCount ?? baseline?.reviewCount ?? 120,
              deliverySlots: parsedConfig.deliverySlots || baseline?.deliverySlots || ["Morning", "Evening"],
              shifts: parsedConfig.shifts || baseline?.shifts || [],
              varieties: parsedConfig.varieties || baseline?.varieties || [],
              services: baseline?.services || [],
            };
          });
        }
      } catch (err) {
        console.warn("Neon query failed, using seeded memory list:", err);
      }
    }

    if (!vendors.length) {
      // Fallback to verified seeded vendors
      vendors = SEEDED_VENDORS.filter((v) => v.status === "VERIFIED");
    }

    // Filter by Category
    if (category !== "ALL") {
      const targetType =
        category === "MILK"
          ? "MILKMAN"
          : category === "WATER"
          ? "WATER_SERVICE"
          : "TIFFIN";
      vendors = vendors.filter((v) => v.vendorType === targetType);
    }

    // Filter by Shift
    if (shift !== "ALL") {
      vendors = vendors.filter((v) =>
        v.shifts?.some((s) => s.id === shift)
      );
    }

    // Filter by Society
    if (society) {
      vendors = vendors.filter((v) =>
        v.coveredSocieties?.some((soc) => soc.toLowerCase().includes(society.toLowerCase()))
      );
    }

    return Response.json(createSuccessResponse(vendors));
  } catch (error) {
    return Response.json(
      createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Failed to load marketplace vendors"
      ),
      { status: 500 }
    );
  }
}
