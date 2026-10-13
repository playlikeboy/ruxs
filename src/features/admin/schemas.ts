import { z } from "zod";

export const vendorStatusActionSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
});

export const createVendorAccountSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  area: z.string().min(2, "Area is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile number starting with 6-9"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessType: z.enum(["tiffin", "water"]),
  upiId: z.string().optional(),
});

export type CreateVendorAccountInput = z.infer<typeof createVendorAccountSchema>;

