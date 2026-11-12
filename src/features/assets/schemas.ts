import { z } from "zod";

export const recordAssetMovementSchema = z.object({
  slug: z.string().min(1).max(120),
  customerId: z.string().min(1).max(64),
  asset: z.string().trim().min(1, "Asset name is required").max(40),
  delta: z
    .number()
    .int()
    .min(-100, "Record at most 100 at a time")
    .max(100, "Record at most 100 at a time")
    .refine((n) => n !== 0, "Asset delta cannot be zero"),
  orderId: z.string().min(1).max(64).optional(),
});
