import { z } from "zod";

export const markDeliveredSchema = z.object({
  slug: z.string().min(1),
  orderId: z.string().min(1),
  cansOut: z.number().int().nonnegative().max(99).default(1),
  cansIn: z.number().int().nonnegative().max(99).default(1),
});

export const markFailedSchema = z.object({
  slug: z.string().min(1),
  orderId: z.string().min(1),
  reason: z.string().trim().min(1, "Failure reason is required (e.g. door locked)").max(200),
});
