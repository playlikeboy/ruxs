import { z } from "zod";
import { WEEKDAYS } from "@/config/service-kinds";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
const mode = z.enum(["home", "studio", "online"]);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\//.test(v), "Photo link must start with https://")
  .optional();

export const bookSessionSchema = z.object({
  clientKey: z.string().uuid(),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  mode,
  paymentMode: z.enum(["online", "pay_at_session"]),
  notes: z.string().trim().max(300).optional(),
});

export const bookingIdSchema = z.object({ bookingId: z.string().min(1) });

export const availabilitySchema = z.object({
  slug: z.string().min(1),
  rules: z.array(z.object({ weekday: z.enum(WEEKDAYS), startTime: time, endTime: time })).max(50),
});

export const timeOffSchema = z.object({
  slug: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  reason: z.string().trim().max(100).optional(),
});

export const removeTimeOffSchema = z.object({ slug: z.string().min(1), id: z.string().min(1) });

export const bookingRulesSchema = z.object({
  slug: z.string().min(1),
  noticeMinutes: z.number().int().min(0).max(10080),
  cancelCutoffHours: z.number().int().min(0).max(168),
});

export const markBookingSchema = z.object({
  slug: z.string().min(1),
  bookingId: z.string().min(1),
  outcome: z.enum(["done", "no_show", "cancelled"]),
  reason: z.string().trim().max(200).optional(),
});

export const saveServiceSchema = z.object({
  slug: z.string().min(1),
  id: z.string().optional(),
  categoryId: z.string().regex(/^[a-z0-9-]+$/, "Pick a category"),
  name: z.string().trim().min(2, "Name the service").max(80),
  description: z.string().trim().max(400).optional(),
  imageUrl: optionalUrl,
  durationMinutes: z.number().int().min(15).max(480),
  priceRupees: z.number().min(0).max(100000),
  modes: z.array(mode).min(1, "Offer at least one session type"),
  isActive: z.boolean(),
});

export const serviceIdSchema = z.object({ slug: z.string().min(1), id: z.string().min(1) });
