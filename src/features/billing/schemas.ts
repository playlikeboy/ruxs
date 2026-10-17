import { z } from "zod";

export const generateMonthlyBillsSchema = z.object({
  slug: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
});
