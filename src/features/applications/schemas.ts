import { z } from "zod";

/** Accepts 98765 43210, 09876543210 or +91 98765 43210 and stores +919876543210. */
const indianMobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^0/, "").replace(/^(?!\+91)/, "+91"))
  .pipe(z.string().regex(/^\+91[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"));

export const applicationSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(80),
  ownerName: z.string().trim().min(2, "Enter your name").max(60),
  phone: indianMobile,
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email or leave it empty").max(120)]).optional(),
  categoryId: z.string().regex(/^[a-z0-9-]+$/, "Pick what you offer").max(40),
  area: z.string().trim().min(2, "Enter your area").max(60),
  city: z.string().trim().min(2, "Enter your city").max(40),
  details: z.string().trim().max(600).optional(),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export const applicationUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "rejected"]).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
});
