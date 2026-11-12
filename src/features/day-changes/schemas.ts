import { z } from "zod";

/** YYYY-MM-DD that is also a real calendar day (rejects 2026-02-31, 2026-13-01). */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(s + "T00:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Date is not a valid calendar day");

export const setDayChangeSchema = z.object({
  // Either token (customer link) OR slug + subscriptionId (vendor staff)
  token: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  subscriptionId: z.string().min(1),
  serviceDate: isoDate,
  kind: z.enum(["skip", "extra", "qty"]),
  qty: z.number().int().nonnegative().max(99).default(0),
});

export const pauseDatesSchema = z.object({
  token: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  subscriptionId: z.string().min(1).optional(), // if omitted on link, pauses all active subscriptions for customer
  startDate: isoDate,
  endDate: isoDate,
});
