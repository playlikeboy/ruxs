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
});

export const inviteStaffSchema = z.object({
  slug: z.string(),
  email: z.string().email("Valid email required"),
  role: z.enum(["staff", "driver"]),
});
