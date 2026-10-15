import { z } from "zod";

const status = z.enum(["placed", "accepted", "out_for_delivery", "delivered", "cancelled", "rejected"]);

export const vendorOrderStatusSchema = z.object({
  slug: z.string().min(1),
  orderId: z.string().min(1),
  to: status,
  reason: z.string().trim().max(200).optional(),
});

export const adminOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  to: status,
  reason: z.string().trim().max(200).optional(),
});
