import { z } from "zod";
import { SERVICE_KIND_IDS } from "@/config/service-kinds";

const time = z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM");
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\//.test(v), "Image link must start with https://")
  .optional();

export const saveProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  kind: z.enum(SERVICE_KIND_IDS),
  name: z.string().trim().min(2, "Item name must be at least 2 characters").max(80),
  description: z.string().trim().max(300).optional(),
  section: z.string().trim().max(40).optional(),
  imageUrl: optionalUrl,
  isVeg: z.boolean().nullable().default(null),
  shift: z.enum(["lunch", "dinner", "morning", "evening"]),
  priceRupees: z.number().positive("Price must be greater than zero").max(100000),
  depositRupees: z.number().nonnegative().max(100000).default(0),
  assetName: z.string().trim().max(30).optional(),
  pollAt: time.optional(),
  cutoffAt: time,
  lateRule: z.enum(["free", "half", "full", "locked"]).default("full"),
  isAvailable: z.boolean().default(true),
  allowSubscription: z.boolean().default(true),
  allowOneTime: z.boolean().default(true),
}).refine((v) => v.allowSubscription || v.allowOneTime, {
  message: "Allow subscriptions, one-time orders, or both",
});

export const productIdSchema = z.object({
  slug: z.string(),
  id: z.string().min(1),
});

export const toggleAvailabilitySchema = productIdSchema.extend({
  isAvailable: z.boolean(),
});
