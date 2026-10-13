import { z } from "zod";

export const setDayChangeSchema = z.object({
  // Either token (customer link) OR slug + subscriptionId (vendor staff)
  token: z.string().optional(),
  slug: z.string().optional(),
  subscriptionId: z.string(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  kind: z.enum(["skip", "extra", "qty"]),
  qty: z.number().int().nonnegative().default(0),
});

export const pauseDatesSchema = z.object({
  token: z.string().optional(),
  slug: z.string().optional(),
  subscriptionId: z.string().optional(), // if omitted on link, pauses all active subscriptions for customer
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});
