import { z } from "zod";

export const addAdjustmentSchema = z.object({
  slug: z.string(),
  customerId: z.string(),
  amountRupees: z.number().refine((n) => n !== 0, "Adjustment amount cannot be zero"),
  notes: z.string().min(2, "Adjustment note is required explaining the reason"),
});

export const markPaidSchema = z.object({
  slug: z.string(),
  invoiceId: z.string(),
  amountRupees: z.number().positive("Payment amount must be greater than zero"),
  notes: z.string().optional(),
});
