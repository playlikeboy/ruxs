import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number with +91"),
  upiVpa: z.string().min(3, "Valid UPI VPA required"),
  city: z.string().min(2, "City is required"),
  area: z.string().min(2, "Area is required"),
  categoryId: z.string().regex(/^[a-z0-9-]+$/, "Pick what your business offers"),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
});

export const inviteStaffSchema = z.object({
  slug: z.string(),
  email: z.string().email("Valid email required"),
  role: z.enum(["staff", "driver"]),
});

/** Everything a vendor may change about their own business (not login, plan, fee or status). */
export const storefrontSchema = z.object({
  slug: z.string(),
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(80),
  phone: z.string().trim().regex(/^\+91[6-9]\d{9}$/, "Use a valid Indian mobile number with +91"),
  upiVpa: z.string().trim().min(3, "UPI ID is required").max(80),
  area: z.string().trim().min(2, "Area is required").max(80),
  city: z.string().trim().min(2, "City is required").max(60),
  mapsUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === "" || /^https:\/\/([a-z.]*\.)?(google\.[a-z.]+|goo\.gl|g\.co)\//.test(v), "Use a Google Maps link")
    .optional(),
  description: z.string().trim().max(400).optional(),
  coverUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https:\/\//.test(v), "Cover photo link must start with https://")
    .optional(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  serviceRadiusKm: z.number().int().min(1).max(50),
  deliveryFeeRupees: z.number().min(0).max(1000),
  minOrderRupees: z.number().min(0).max(10000),
  acceptingOrders: z.boolean(),
});
