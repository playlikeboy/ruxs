import { z } from "zod";

export const recordAssetMovementSchema = z.object({
  slug: z.string(),
  customerId: z.string(),
  asset: z.string().min(1, "Asset name is required"),
  delta: z.number().int().refine((n) => n !== 0, "Asset delta cannot be zero"),
  orderId: z.string().optional(),
});
