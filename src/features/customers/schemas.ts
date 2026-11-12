import { z } from "zod";

export const importCustomersSchema = z.object({
  slug: z.string().min(1),
  rawText: z.string().min(1, "Please provide customer lines to import").max(100_000, "Paste fewer lines at a time"),
});

export const resetCustomerLinkSchema = z.object({
  slug: z.string().min(1),
  customerId: z.string().min(1),
});
