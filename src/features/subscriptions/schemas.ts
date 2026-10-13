import { z } from "zod";

export const saveSubscriptionSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  customerId: z.string(),
  productId: z.string(),
  qty: z.number().int().positive("Quantity must be at least 1"),
  days: z.array(z.string()).min(1, "Select at least one delivery day"),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().nullable(),
});
