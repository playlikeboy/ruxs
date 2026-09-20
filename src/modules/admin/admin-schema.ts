import { z } from "zod";

export const VendorApprovalStatusSchema = z.enum([
  "PENDING_APPROVAL",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "SUSPENDED",
]);

export type VendorApprovalStatus = z.infer<typeof VendorApprovalStatusSchema>;

export const VendorPlanTierSchema = z.enum([
  "STARTER",
  "GROWTH",
  "PRO",
]);

export type VendorPlanTier = z.infer<typeof VendorPlanTierSchema>;

export const PlatformAuditActionSchema = z.enum([
  "VENDOR_APPROVED",
  "VENDOR_SUSPENDED",
  "PLAN_UPGRADED",
  "DISPUTE_ESCALATED",
  "SETTING_CHANGED",
  "OVERNIGHT_RUN_TRIGGERED",
  "FULFILLMENT_TRANSITIONED",
  "CUTOFF_LOCKED",
  "DISPUTE_REFUNDED",
  "DISPUTE_UPHELD",
  "ASSET_EXCHANGE_RECORDED",
  "KHATA_ADJUSTMENT_POSTED",
  "NOTIFICATION_DISPATCHED",
  "VENDOR_CREATED",
  "VENDOR_PROVISIONED_DIRECT",
  "CREDENTIALS_GENERATED",
]);

export type PlatformAuditAction = z.infer<typeof PlatformAuditActionSchema>;

export const PlatformAuditLogSchema = z.object({
  id: z.string(),
  adminUserId: z.string(),
  adminEmail: z.string(),
  action: PlatformAuditActionSchema,
  targetType: z.string(),
  targetId: z.string(),
  details: z.string(),
  ipAddress: z.string().optional(),
  createdAt: z.string(),
});

export type PlatformAuditLog = z.infer<typeof PlatformAuditLogSchema>;

export const AdminVendorProfileSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  slug: z.string(),
  phone: z.string(),
  vendorType: z.enum(["MILKMAN", "WATER_SERVICE", "TIFFIN"]).default("TIFFIN"),
  serviceCategories: z.array(z.string()),
  coveredSocieties: z.array(z.string()),
  status: VendorApprovalStatusSchema.default("PENDING_APPROVAL"),
  tier: VendorPlanTierSchema.default("STARTER"),
  subscriberCount: z.number().int().nonnegative().default(0),
  monthlyVolumePaise: z.number().int().nonnegative().default(0),
  typeConfig: z.record(z.string(), z.any()).optional().default({}),
  credentials: z
    .object({
      loginToken: z.string(),
      accessPin: z.string(),
      directUrl: z.string(),
      generatedAt: z.string().optional(),
    })
    .optional(),
  verifiedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminVendorProfile = z.infer<typeof AdminVendorProfileSchema>;
