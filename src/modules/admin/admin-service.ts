import {
  AdminVendorProfile,
  AdminVendorProfileSchema,
  PlatformAuditLog,
  PlatformAuditLogSchema,
  VendorApprovalStatus,
  VendorPlanTier,
} from "./admin-schema";
import { db, isTestEnv } from "../../shared/db";
import { tenants as tenantsTable, auditLogs as auditLogsTable, subscriptions as subscriptionsTable } from "../../shared/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateVendorSlug, VendorType } from "../vendor/vendor-schema";
import { SEEDED_VENDORS } from "../../shared/db/seed";

const vendorsStore = new Map<string, AdminVendorProfile>();
const auditLogsStore: PlatformAuditLog[] = [];

// Seed baseline in-memory vendors
for (const sv of SEEDED_VENDORS) {
  const token = `vtok_${sv.slug}_seed`;
  const pin = "123456";
  const profile: AdminVendorProfile = {
    id: sv.id,
    businessName: sv.businessName,
    slug: sv.slug,
    phone: sv.phone,
    vendorType: sv.vendorType,
    serviceCategories: [sv.vendorType === "MILKMAN" ? "MILK" : sv.vendorType === "WATER_SERVICE" ? "WATER" : "TIFFIN"],
    coveredSocieties: sv.coveredSocieties,
    status: sv.status as VendorApprovalStatus,
    tier: sv.planTier,
    subscriberCount: sv.status === "VERIFIED" ? 28 : 0,
    monthlyVolumePaise: sv.status === "VERIFIED" ? 3500000 : 0,
    typeConfig: {
      shifts: sv.shifts,
      varieties: sv.varieties || [],
    },
    credentials: {
      loginToken: token,
      accessPin: pin,
      directUrl: `https://ruxs.in/login?vendorToken=${token}&slug=${sv.slug}`,
      generatedAt: new Date().toISOString(),
    },
    verifiedAt: sv.status === "VERIFIED" ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vendorsStore.set(profile.id, profile);
  vendorsStore.set(profile.slug, profile);
}

export class AdminService {
  /**
   * Initializes or registers a vendor into admin directory
   */
  static registerVendor(input: {
    id: string;
    businessName: string;
    slug: string;
    phone: string;
    vendorType?: VendorType;
    serviceCategories: string[];
    coveredSocieties: string[];
    tier?: VendorPlanTier;
    status?: VendorApprovalStatus;
    typeConfig?: Record<string, any>;
  }): AdminVendorProfile {
    const profile = AdminVendorProfileSchema.parse({
      id: input.id,
      businessName: input.businessName,
      slug: input.slug,
      phone: input.phone,
      vendorType: input.vendorType || "TIFFIN",
      serviceCategories: input.serviceCategories,
      coveredSocieties: input.coveredSocieties,
      status: input.status || "PENDING_VERIFICATION",
      tier: input.tier || "STARTER",
      subscriberCount: 0,
      monthlyVolumePaise: 0,
      typeConfig: input.typeConfig || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    vendorsStore.set(profile.id, profile);
    vendorsStore.set(profile.slug, profile);
    return profile;
  }

  /**
   * Directly provisions an auto-approved vendor from Mission Control with instant credentials
   */
  static async provisionVendorDirect(
    input: {
      businessName: string;
      phone: string;
      vendorType: VendorType;
      locality: string;
      city?: string;
      coveredSocieties: string[];
      upiId?: string;
      tier?: VendorPlanTier;
      typeConfig?: Record<string, any>;
    },
    adminUser: { userId: string; email: string }
  ): Promise<AdminVendorProfile> {
    const vendorId = `ten_${crypto.randomUUID()}`;
    const slug = generateVendorSlug(input.businessName, input.locality);
    const token = `vtok_${slug}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));

    const credentials = {
      loginToken: token,
      accessPin: pin,
      directUrl: `https://ruxs.in/login?vendorToken=${token}&slug=${slug}`,
      generatedAt: new Date().toISOString(),
    };

    const profile: AdminVendorProfile = {
      id: vendorId,
      businessName: input.businessName,
      slug,
      phone: input.phone,
      vendorType: input.vendorType,
      serviceCategories: [input.vendorType === "MILKMAN" ? "MILK" : input.vendorType === "WATER_SERVICE" ? "WATER" : "TIFFIN"],
      coveredSocieties: input.coveredSocieties,
      status: "VERIFIED",
      tier: input.tier || "STARTER",
      subscriberCount: 0,
      monthlyVolumePaise: 0,
      typeConfig: input.typeConfig || {},
      credentials,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vendorsStore.set(vendorId, profile);
    vendorsStore.set(slug, profile);

    this.logAction({
      adminUserId: adminUser.userId,
      adminEmail: adminUser.email,
      action: "VENDOR_PROVISIONED_DIRECT",
      targetType: "VENDOR",
      targetId: vendorId,
      details: `Vendor '${input.businessName}' (${input.vendorType}) directly authorized by admin. Credentials generated.`,
    });

    if (!isTestEnv) {
      try {
        await db
          .insert(tenantsTable)
          .values({
            id: vendorId,
            businessName: input.businessName,
            slug,
            phone: input.phone,
            upiId: input.upiId || "merchant@upi",
            vendorType: input.vendorType,
            planTier: input.tier || "STARTER",
            address: `${input.locality}, ${input.city || "Bengaluru"}`,
            status: "VERIFIED",
            typeConfig: JSON.stringify(profile.typeConfig),
            credentials: JSON.stringify(credentials),
          })
          .onConflictDoUpdate({
            target: tenantsTable.id,
            set: {
              status: "VERIFIED",
              credentials: JSON.stringify(credentials),
              updatedAt: new Date(),
            },
          });
      }
    }

    return profile;
  }

  /**
   * Verifies and approves a local vendor for live operations
   */
  static verifyVendor(
    vendorIdOrSlug: string,
    adminUser: { userId: string; email: string }
  ): AdminVendorProfile {
    const vendor = vendorsStore.get(vendorIdOrSlug);
    if (!vendor) {
      throw new Error(`Vendor ${vendorIdOrSlug} not found`);
    }

    vendor.status = "VERIFIED";
    vendor.verifiedAt = new Date().toISOString();
    vendor.updatedAt = new Date().toISOString();

    if (!vendor.credentials) {
      const token = `vtok_${vendor.slug}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
      vendor.credentials = {
        loginToken: token,
        accessPin: pin,
        directUrl: `https://ruxs.in/login?vendorToken=${token}&slug=${vendor.slug}`,
        generatedAt: new Date().toISOString(),
      };
    }

    vendorsStore.set(vendor.id, vendor);
    vendorsStore.set(vendor.slug, vendor);

    this.logAction({
      adminUserId: adminUser.userId,
      adminEmail: adminUser.email,
      action: "VENDOR_APPROVED",
      targetType: "VENDOR",
      targetId: vendor.id,
      details: `Vendor '${vendor.businessName}' verified and approved for society onboarding`,
    });

    if (!isTestEnv) {
      db.update(tenantsTable)
        .set({ status: "VERIFIED", credentials: JSON.stringify(vendor.credentials), updatedAt: new Date() })
        .where(eq(tenantsTable.id, vendor.id))
        .catch((err) => console.warn("Neon update failed:", err));
    }

    return vendor;
  }

  /**
   * Retrieves a vendor from in-memory cache by ID or slug
   */
  static getVendor(vendorIdOrSlug: string): AdminVendorProfile | undefined {
    return vendorsStore.get(vendorIdOrSlug);
  }

  /**
   * Suspends a vendor
   */
  static suspendVendor(
    vendorId: string,
    reason: string,
    adminUser: { userId: string; email: string }
  ): AdminVendorProfile {
    const vendor = vendorsStore.get(vendorId);
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    vendor.status = "SUSPENDED";
    vendor.updatedAt = new Date().toISOString();
    vendorsStore.set(vendor.id, vendor);
    vendorsStore.set(vendor.slug, vendor);

    this.logAction({
      adminUserId: adminUser.userId,
      adminEmail: adminUser.email,
      action: "VENDOR_SUSPENDED",
      targetType: "VENDOR",
      targetId: vendor.id,
      details: `Reason: ${reason}`,
    });

    if (!isTestEnv) {
      db.update(tenantsTable)
        .set({ status: "SUSPENDED", updatedAt: new Date() })
        .where(eq(tenantsTable.id, vendor.id))
        .catch((err) => console.warn("Neon suspend failed:", err));
    }

    return vendor;
  }

  /**
   * Generates or regenerates merchant login credentials
   */
  static generateCredentials(
    vendorIdOrSlug: string,
    adminUser: { userId: string; email: string }
  ): { loginToken: string; accessPin: string; directUrl: string; shareCardText: string } {
    const vendor = vendorsStore.get(vendorIdOrSlug);
    if (!vendor) {
      throw new Error(`Vendor ${vendorIdOrSlug} not found`);
    }

    const token = `vtok_${vendor.slug}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    const directUrl = `https://ruxs.in/login?vendorToken=${token}&slug=${vendor.slug}`;

    const creds = {
      loginToken: token,
      accessPin: pin,
      directUrl,
      generatedAt: new Date().toISOString(),
    };

    vendor.credentials = creds;
    vendorsStore.set(vendor.id, vendor);
    vendorsStore.set(vendor.slug, vendor);

    const shareCardText = `RUXS Merchant Access: ${vendor.businessName}
Your merchant operations cockpit is ready.
Direct Login: ${directUrl}
Access PIN: ${pin}
Manage deliveries, daily cutoffs, and digital khata.`;

    this.logAction({
      adminUserId: adminUser.userId,
      adminEmail: adminUser.email,
      action: "CREDENTIALS_GENERATED",
      targetType: "VENDOR",
      targetId: vendor.id,
      details: `New merchant credentials issued for '${vendor.businessName}'`,
    });

    if (!isTestEnv) {
      db.update(tenantsTable)
        .set({ credentials: JSON.stringify(creds), updatedAt: new Date() })
        .where(eq(tenantsTable.id, vendor.id))
        .catch((err) => console.warn("Neon credentials update failed:", err));
    }

    return { ...creds, shareCardText };
  }

  /**
   * Updates a vendor's plan tier
   */
  static updateVendorTier(
    vendorId: string,
    newTier: VendorPlanTier,
    adminUser: { userId: string; email: string }
  ): AdminVendorProfile {
    const vendor = vendorsStore.get(vendorId);
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const oldTier = vendor.tier;
    vendor.tier = newTier;
    vendor.updatedAt = new Date().toISOString();
    vendorsStore.set(vendor.id, vendor);
    vendorsStore.set(vendor.slug, vendor);

    this.logAction({
      adminUserId: adminUser.userId,
      adminEmail: adminUser.email,
      action: "PLAN_UPGRADED",
      targetType: "VENDOR",
      targetId: vendor.id,
      details: `Plan tier updated from ${oldTier} to ${newTier}`,
    });

    return vendor;
  }

  /**
   * Records an audit log entry
   */
  static logAction(input: {
    adminUserId: string;
    adminEmail: string;
    action: any;
    targetType: string;
    targetId: string;
    details: string;
    ipAddress?: string;
  }): PlatformAuditLog {
    const log = PlatformAuditLogSchema.parse({
      id: `aud_${crypto.randomUUID()}`,
      adminUserId: input.adminUserId,
      adminEmail: input.adminEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details,
      ipAddress: input.ipAddress,
      createdAt: new Date().toISOString(),
    });

    auditLogsStore.unshift(log);
    return log;
  }

  /**
   * Retrieves audit logs with optional limit
   */
  static getAuditLogs(limit: number = 50): PlatformAuditLog[] {
    return auditLogsStore.slice(0, limit);
  }

  /**
   * Lists all vendors with optional status filter from Neon DB
   */
  static async listVendorsAsync(status?: string): Promise<AdminVendorProfile[]> {
    if (!isTestEnv) {
      try {
        const rows = await db.select().from(tenantsTable);
        if (rows && rows.length > 0) {
          const mapped: AdminVendorProfile[] = rows.map((t) => {
            let parsedConfig = {};
            let parsedCreds;
            try {
              if (t.typeConfig) parsedConfig = JSON.parse(t.typeConfig);
              if (t.credentials) parsedCreds = JSON.parse(t.credentials);
            } catch {}

            const baseline = SEEDED_VENDORS.find((s) => s.id === t.id || s.slug === t.slug);

            const vType: VendorType = (t.vendorType as VendorType) || baseline?.vendorType || (
              t.slug.includes("milk") ? "MILKMAN" : t.slug.includes("water") ? "WATER_SERVICE" : "TIFFIN"
            );

            return {
              id: t.id,
              businessName: t.businessName,
              slug: t.slug,
              phone: t.phone,
              vendorType: vType,
              serviceCategories: [vType === "MILKMAN" ? "MILK" : vType === "WATER_SERVICE" ? "WATER" : "TIFFIN"],
              coveredSocieties: (parsedConfig as any).coveredSocieties || baseline?.coveredSocieties || ["Sobha Classic", "Purva Fairmont"],
              status: (t.status === "ACTIVE" ? "VERIFIED" : t.status) as VendorApprovalStatus,
              tier: (t.planTier || "STARTER") as VendorPlanTier,
              subscriberCount: 25,
              monthlyVolumePaise: 3000000,
              typeConfig: parsedConfig,
              credentials: parsedCreds,
              verifiedAt: t.createdAt.toISOString(),
              createdAt: t.createdAt.toISOString(),
              updatedAt: t.updatedAt.toISOString(),
            };
          });

          if (status) {
            return mapped.filter((v) => v.status === status);
          }
          return mapped;
        }
      } catch {
        // Fallback
      }
    }
    const list = Array.from(new Set(vendorsStore.values()));
    if (status) {
      return list.filter((v) => v.status === status);
    }
    return list;
  }

  /**
   * Retrieves single vendor detailed dossier by slug or ID
   */
  static async getVendorDetailBySlug(slugOrId: string): Promise<{
    vendor: AdminVendorProfile;
    auditLogs: PlatformAuditLog[];
    catalog?: any;
  } | null> {
    const list = await this.listVendorsAsync();
    const vendor = list.find((v) => v.slug === slugOrId || v.id === slugOrId);
    if (!vendor) return null;

    const auditLogs = auditLogsStore.filter((l) => l.targetId === vendor.id);
    const baseline = SEEDED_VENDORS.find((s) => s.id === vendor.id || s.slug === vendor.slug);

    return {
      vendor,
      auditLogs,
      catalog: baseline ? { services: baseline.services, shifts: baseline.shifts, varieties: baseline.varieties } : undefined,
    };
  }

  /**
   * Retrieves audit logs from Neon DB
   */
  static async getAuditLogsAsync(limit: number = 50): Promise<PlatformAuditLog[]> {
    if (!isTestEnv) {
      try {
        const rows = await db
          .select()
          .from(auditLogsTable)
          .orderBy(desc(auditLogsTable.createdAt))
          .limit(limit);

        if (rows && rows.length > 0) {
          return rows.map((l) => ({
            id: l.id,
            adminUserId: l.adminUserId,
            adminEmail: l.adminEmail,
            action: l.action as any,
            targetType: l.targetType,
            targetId: l.targetId,
            details: l.details,
            ipAddress: undefined,
            createdAt: l.createdAt.toISOString(),
          }));
        }
      } catch {}
    }
    return this.getAuditLogs(limit);
  }
}
