import { z } from "zod";
import { WEEKDAYS } from "@/config/service-kinds";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-().]/g, ""))
  .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number")
  .transform((v) => (v.startsWith("+91") ? v : "+91" + v));

export const saveProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone,
  society: z.string().trim().min(2, "Enter your society or building").max(120),
  tower: z.string().trim().max(40).default(""),
  floor: z.string().trim().max(20).default(""),
  flat: z.string().trim().min(1, "Enter your flat or house number").max(40),
  landmark: z.string().trim().max(120).optional(),
  area: z.string().trim().min(2, "Enter your area").max(80),
  city: z.string().trim().min(2, "Enter your city").max(60),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const saveLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const placeOrderSchema = z.object({
  clientKey: z.string().uuid(),
  vendorSlug: z.string().min(1),
  items: z
    .array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(20) }))
    .min(1, "Your cart is empty")
    .max(40),
  deliverOn: z.enum(["today", "tomorrow"]),
  slot: z.enum(["asap", "morning", "lunch", "evening", "dinner"]),
  paymentMode: z.enum(["cod", "monthly_bill"]),
  notes: z.string().trim().max(300).optional(),
});

export const cancelOrderSchema = z.object({ orderId: z.string().min(1) });

export const subscribeSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(10),
  days: z.array(z.enum(WEEKDAYS)).min(1, "Pick at least one day"),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const endSubscriptionSchema = z.object({ subscriptionId: z.string().min(1) });

export const myDayChangeSchema = z.object({
  subscriptionId: z.string().min(1),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["skip", "deliver"]),
});
