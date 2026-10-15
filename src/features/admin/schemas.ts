import { z } from "zod";

const optionalCoord = (min: number, max: number) => z.number().min(min).max(max).nullable();

export const vendorDetailsSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(80),
  phone: z.string().trim().regex(/^\+91[6-9]\d{9}$/, "Use a valid Indian mobile number with +91"),
  upiVpa: z.string().trim().min(3, "UPI ID is required").max(80),
  city: z.string().trim().min(2, "City is required").max(60),
  area: z.string().trim().min(2, "Area is required").max(80),
  description: z.string().trim().max(400).optional(),
  latitude: optionalCoord(-90, 90),
  longitude: optionalCoord(-180, 180),
  serviceRadiusKm: z.number().int().min(1).max(50),
  deliveryFeeRupees: z.number().min(0).max(1000),
  minOrderRupees: z.number().min(0).max(10000),
  commissionPercent: z.number().min(0).max(50),
});

export const createVendorSchema = vendorDetailsSchema.extend({
  slug: z
    .string()
    .trim()
    .min(3, "Store URL must be at least 3 characters")
    .max(40)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
});

export const updateVendorSchema = vendorDetailsSchema.extend({
  vendorId: z.string().min(1),
  plan: z.enum(["free", "starter", "pro"]),
  acceptingOrders: z.boolean(),
});

export const vendorIdSchema = z.object({ vendorId: z.string().min(1) });

export const vendorStatusSchema = z.object({
  vendorId: z.string().min(1),
  status: z.enum(["pending", "active", "suspended"]),
});

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #FFE8DD");

export const categorySchema = z.object({
  id: z.string().trim().min(2).max(30).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens"),
  label: z.string().trim().min(2).max(40),
  shortLabel: z.string().trim().min(2).max(14),
  emoji: z.string().trim().min(1).max(8),
  blurb: z.string().trim().max(80).default(""),
  tint: hex,
  coverFrom: hex,
  coverTo: hex,
  sort: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export const localitySchema = z.object({
  id: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens"),
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isActive: z.boolean(),
});

export const adminEmailSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });
export const adminIdSchema = z.object({ id: z.string().min(1) });
