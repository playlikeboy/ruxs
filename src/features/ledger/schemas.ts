import { z } from "zod";

export const addAdjustmentSchema = z.object({
  slug: z.string().min(1),
  customerId: z.string().min(1),
  amountRupees: z.number().refine((n) => n !== 0, "Adjustment amount cannot be zero"),
  notes: z.string().trim().min(2, "Adjustment note is required explaining the reason").max(500),
});

export const markPaidSchema = z.object({
  slug: z.string().min(1),
  invoiceId: z.string().min(1),
  amountRupees: z.number().positive("Payment amount must be greater than zero"),
  notes: z.string().trim().max(200).optional(),
});
