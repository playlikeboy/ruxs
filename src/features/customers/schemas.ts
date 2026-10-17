import { z } from "zod";

export const importCustomersSchema = z.object({
  slug: z.string(),
  rawText: z.string().min(1, "Please provide customer lines to import"),
});

export const resetCustomerLinkSchema = z.object({
  slug: z.string(),
  customerId: z.string(),
});
