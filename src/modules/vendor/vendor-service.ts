import {
  VendorOnboardingInput,
  VendorProfile,
  VendorType,
  VendorApprovalStatus,
  VendorCredentials,
  generateVendorSlug,
  VendorOnboardingSchema,
} from "./vendor-schema";
import { db, isTestEnv } from "../../shared/db";
import { tenants as tenantsTable } from "../../shared/db/schema";
import { eq } from "drizzle-orm";

// In-memory mock store for immediate edge & unit-test reliability
const vendorStore = new Map<string, VendorProfile>();

export class VendorService {
  /**
   * Onboards a new vendor business and provisions their application in PENDING_APPROVAL state
   */
  static async onboardVendor(
    rawInput: unknown,
    options?: { autoApprove?: boolean; customId?: string }
  ): Promise<VendorProfile> {
    const validated = VendorOnboardingSchema.parse(rawInput);

    // Map legacy primaryCategory to vendorType if needed
    let resolvedType: VendorType = validated.vendorType || "TIFFIN";
    if (validated.primaryCategory) {
      if (validated.primaryCategory === "MILK") resolvedType = "MILKMAN";
      else if (validated.primaryCategory === "WATER") resolvedType = "WATER_SERVICE";
      else resolvedType = "TIFFIN";
    }

    const vendorId = options?.customId || `ten_${Math.random().toString(36).substring(2, 11)}`;
    const slug = generateVendorSlug(validated.businessName, validated.locality);
    const inviteUrl = `https://ruxs.in/v/${slug}`;
    const qrPayload = `upi://pay?pa=${validated.upiId}&pn=${encodeURIComponent(
      validated.businessName
    )}&cu=INR`;

    const token = `vtok_${slug}_${Math.random().toString(36).substring(2, 8)}`;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const credentials: VendorCredentials = {
      loginToken: token,
      accessPin: pin,
      directUrl: `https://ruxs.in/login?vendorToken=${token}&slug=${slug}`,
      generatedAt: new Date().toISOString(),
    };

    const status: VendorApprovalStatus = options?.autoApprove ? "VERIFIED" : "PENDING_APPROVAL";

    const profile: VendorProfile = {
      id: vendorId,
      businessName: validated.businessName,
      slug,
      phone: validated.phone,
      upiId: validated.upiId,
      vendorType: resolvedType,
      primaryCategory: validated.primaryCategory || (resolvedType === "MILKMAN" ? "MILK" : resolvedType === "WATER_SERVICE" ? "WATER" : "TIFFIN"),
      typeConfig: validated.typeConfig || {},
      locality: validated.locality,
      city: validated.city,
      coveredSocieties: validated.coveredSocieties,
      inviteUrl,
      qrPayload,
      status,
      credentials,
      createdAt: new Date().toISOString(),
      verifiedAt: options?.autoApprove ? new Date().toISOString() : undefined,
    };

    vendorStore.set(vendorId, profile);
    vendorStore.set(slug, profile);

    if (!isTestEnv) {
      try {
        await db
          .insert(tenantsTable)
          .values({
            id: vendorId,
            businessName: profile.businessName,
            slug: profile.slug,
            phone: profile.phone,
            email: validated.email || null,
            upiId: profile.upiId,
            fssaiNumber: validated.fssaiNumber || null,
            planTier: "STARTER",
            vendorType: profile.vendorType,
            typeConfig: JSON.stringify(profile.typeConfig),
            credentials: JSON.stringify(profile.credentials),
            address: `${profile.locality}, ${profile.city}`,
            status: profile.status,
          })
          .onConflictDoUpdate({
            target: tenantsTable.id,
            set: {
              businessName: profile.businessName,
              vendorType: profile.vendorType,
              typeConfig: JSON.stringify(profile.typeConfig),
              credentials: JSON.stringify(profile.credentials),
              status: profile.status,
              updatedAt: new Date(),
            },
          });
      } catch (err) {
        console.warn("Could not persist vendor to Neon, keeping in-memory:", err);
      }
    }

    return profile;
  }

  /**
   * Generates or regenerates login credentials for a vendor
   */
  static async generateVendorCredentials(vendorIdOrSlug: string): Promise<VendorCredentials> {
    const vendor = vendorStore.get(vendorIdOrSlug);
    if (!vendor) {
      throw new Error(`Vendor not found: ${vendorIdOrSlug}`);
    }

    const token = `vtok_${vendor.slug}_${Math.random().toString(36).substring(2, 8)}`;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const credentials: VendorCredentials = {
      loginToken: token,
      accessPin: pin,
      directUrl: `https://ruxs.in/login?vendorToken=${token}&slug=${vendor.slug}`,
      generatedAt: new Date().toISOString(),
    };

    vendor.credentials = credentials;
    vendorStore.set(vendor.id, vendor);
    vendorStore.set(vendor.slug, vendor);

    if (!isTestEnv) {
      try {
        await db
          .update(tenantsTable)
          .set({
            credentials: JSON.stringify(credentials),
            updatedAt: new Date(),
          })
          .where(eq(tenantsTable.id, vendor.id));
      } catch (err) {
        console.warn("Could not update credentials in Neon:", err);
      }
    }

    return credentials;
  }

  /**
   * Approves a vendor application
   */
  static async approveVendor(vendorIdOrSlug: string): Promise<VendorProfile> {
    const vendor = vendorStore.get(vendorIdOrSlug);
    if (!vendor) {
      throw new Error(`Vendor not found: ${vendorIdOrSlug}`);
    }

    vendor.status = "VERIFIED";
    vendor.verifiedAt = new Date().toISOString();
    vendorStore.set(vendor.id, vendor);
    vendorStore.set(vendor.slug, vendor);

    if (!isTestEnv) {
      try {
        await db
          .update(tenantsTable)
          .set({
            status: "VERIFIED",
            updatedAt: new Date(),
          })
          .where(eq(tenantsTable.id, vendor.id));
      } catch (err) {
        console.warn("Could not update approval in Neon:", err);
      }
    }

    return vendor;
  }

  /**
   * Retrieves a vendor by public slug
   */
  static async getVendorBySlug(slug: string): Promise<VendorProfile | null> {
    const inMem = vendorStore.get(slug);
    if (inMem) return inMem;

    if (!isTestEnv) {
      try {
        const rows = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, slug));
        if (rows && rows[0]) {
          const row = rows[0];
          let parsedConfig = {};
          let parsedCreds: VendorCredentials | undefined;
          try {
            if (row.typeConfig) parsedConfig = JSON.parse(row.typeConfig);
            if (row.credentials) parsedCreds = JSON.parse(row.credentials);
          } catch {}

          const profile: VendorProfile = {
            id: row.id,
            businessName: row.businessName,
            slug: row.slug,
            phone: row.phone,
            upiId: row.upiId || "",
            vendorType: (row.vendorType as VendorType) || "TIFFIN",
            primaryCategory: (row.vendorType === "MILKMAN" ? "MILK" : row.vendorType === "WATER_SERVICE" ? "WATER" : "TIFFIN"),
            typeConfig: parsedConfig,
            locality: row.address ? row.address.split(",")[0] : "Bengaluru",
            city: row.address ? row.address.split(",")[1]?.trim() || "Bengaluru" : "Bengaluru",
            coveredSocieties: (parsedConfig as any).coveredSocieties || ["Sobha Classic", "Purva Fairmont"],
            inviteUrl: `https://ruxs.in/v/${row.slug}`,
            qrPayload: `upi://pay?pa=${row.upiId}&pn=${encodeURIComponent(row.businessName)}&cu=INR`,
            status: (row.status as VendorApprovalStatus) || "PENDING_APPROVAL",
            credentials: parsedCreds,
            createdAt: row.createdAt.toISOString(),
          };
          vendorStore.set(row.id, profile);
          vendorStore.set(row.slug, profile);
          return profile;
        }
      } catch (err) {
        console.warn("Error fetching vendor from Neon:", err);
      }
    }

    return null;
  }

  /**
   * Retrieves a vendor by id
   */
  static async getVendorById(id: string): Promise<VendorProfile | null> {
    return vendorStore.get(id) || null;
  }

  /**
   * Clears the store (for testing)
   */
  static clearStore(): void {
    vendorStore.clear();
  }
}
