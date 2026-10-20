import { z } from "zod";

export const childIdSchema = z.object({
  childId: z.string().uuid(),
});

export const saveChildSchema = z.object({
  id: z.string().uuid().optional(),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  birthYear: z.coerce.number().int().min(2008).max(new Date().getFullYear()),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.literal("")),
  schoolClass: z.string().max(30).optional().or(z.literal("")),
  activityNotes: z.string().max(500).optional().or(z.literal("")),
});

export const bookKidsServiceSchema = z.object({
  serviceId: z.string().uuid(),
  childId: z.string().uuid(),
  startsAt: z.string().datetime(),
  deliveryMode: z.enum(["home", "studio", "online"]),
  address: z.string().max(255).optional(),
  includeMaterials: z.boolean().default(false),
  paymentMode: z.enum(["online", "pay_at_session"]).default("pay_at_session"),
  clientKey: z.string().min(8).max(64),
});

export const cancelKidsBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(255).optional(),
});

export const enrollWorkshopSchema = z.object({
  workshopId: z.string().uuid(),
  childId: z.string().uuid(),
  clientKey: z.string().min(8).max(64),
});

export const cancelWorkshopEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid(),
  reason: z.string().max(255).optional(),
});

export const purchasePassSchema = z.object({
  passId: z.string().min(2).max(64),
  clientKey: z.string().min(8).max(64).optional(),
});

export const redeemPassSchema = z.object({
  purchaseId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  clientKey: z.string().min(8).max(64),
});

export const saveConsentSchema = z.object({
  childId: z.string().uuid(),
  consentType: z.enum(["home_supervision", "photo_waiver", "emergency_medical", "activity_participation"]),
  policyVersion: z.string().default("2026-v1"),
});

export const submitKidsReviewSchema = z.object({
  vendorId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().max(1000).optional(),
});

export const saveKidsServiceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2), // vendor slug
  categoryId: z.string().min(2),
  title: z.string().trim().min(3).max(100),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  minAge: z.coerce.number().int().min(3).max(16),
  maxAge: z.coerce.number().int().min(3).max(18),
  suitableClasses: z.array(z.string()).default([]),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  deliveryModes: z.array(z.enum(["home", "studio", "online"])).min(1),
  priceRupees: z.coerce.number().int().min(0).max(50000),
  materialFeePolicy: z.enum(["included", "extra", "required"]).default("included"),
  materialFeeRupees: z.coerce.number().int().min(0).max(10000).default(0),
});

export const saveKidsWorkshopSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2), // vendor slug
  categoryId: z.string().min(2),
  title: z.string().trim().min(3).max(120),
  description: z.string().max(2000).optional(),
  minAge: z.coerce.number().int().min(3).max(16),
  maxAge: z.coerce.number().int().min(3).max(18),
  eligibleClasses: z.array(z.string()).default([]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  enrollmentDeadline: z.string().datetime(),
  venueOrMode: z.string().min(2).max(100),
  address: z.string().max(255).optional(),
  capacity: z.coerce.number().int().min(1).max(100),
  priceRupees: z.coerce.number().int().min(0).max(100000),
  materialsDescription: z.string().max(500).optional(),
  publicationState: z.enum(["draft", "published", "archived"]).default("published"),
  cancellationPolicy: z.string().max(500).optional(),
});

export const adminVerifyProviderSchema = z.object({
  vendorId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "suspended", "pending"]),
  safetyReviewStatus: z.enum(["passed", "flagged", "pending"]).default("passed"),
  safetyNotes: z.string().max(1000).optional(),
});
