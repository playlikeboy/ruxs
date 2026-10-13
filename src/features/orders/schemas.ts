import { z } from "zod";

export const markDeliveredSchema = z.object({
  slug: z.string(),
  orderId: z.string(),
  cansOut: z.number().int().nonnegative().default(1),
  cansIn: z.number().int().nonnegative().default(1),
});

export const markFailedSchema = z.object({
  slug: z.string(),
  orderId: z.string(),
  reason: z.string().min(1, "Failure reason is required (e.g. door locked)"),
});
