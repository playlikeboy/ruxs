import { z } from "zod";

export const vendorStatusActionSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
});

export const createVendorForAdminSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Portal slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens for the URL"),
  ownerEmail: z.string().trim().email("Enter a valid owner email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\+91[6-9]\d{9}$/, "Use a valid Indian mobile number with +91"),
  upiVpa: z.string().trim().min(3, "UPI ID is required"),
  city: z.string().trim().min(2, "City is required"),
  area: z.string().trim().min(2, "Area or locality is required"),
});

export const setVendorCredentialsSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  ownerEmail: z.string().trim().email("Enter a valid owner email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

export const adminUpdateVendorSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+91[6-9]\d{9}$/, "Use a valid Indian mobile number with +91"),
  upiVpa: z.string().trim().min(3).max(80),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().min(2).max(80),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  serviceRadiusKm: z.number().int().min(1).max(50),
  deliveryFeeRupees: z.number().min(0).max(1000),
  plan: z.enum(["free", "starter", "pro"]),
  acceptingOrders: z.boolean(),
});
