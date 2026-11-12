import { z } from "zod";

export const generateMonthlyBillsSchema = z.object({
  slug: z.string().min(1),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM"),
});
