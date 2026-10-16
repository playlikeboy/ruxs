import { z } from "zod";
import { WEEKDAYS } from "@/config/service-kinds";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

export const bookSessionSchema = z.object({
  clientKey: z.string().uuid(),
  productId: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  mode: z.enum(["home", "studio", "online"]),
  paymentMode: z.enum(["online", "cod"]),
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

export const bookingSettingsSchema = z.object({
  slug: z.string().min(1),
  modes: z.array(z.enum(["home", "studio", "online"])).min(1, "Offer at least one mode"),
  noticeMinutes: z.number().int().min(0).max(10080),
  cancelCutoffHours: z.number().int().min(0).max(168),
});

export const markBookingSchema = z.object({
  slug: z.string().min(1),
  bookingId: z.string().min(1),
  outcome: z.enum(["done", "no_show", "cancelled"]),
  reason: z.string().trim().max(200).optional(),
});
