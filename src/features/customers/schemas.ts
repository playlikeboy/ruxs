import { z } from "zod";

export const importCustomerRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  society: z.string().min(1, "Society is required"),
  tower: z.string().min(1, "Tower is required"),
  floor: z.string().min(1, "Floor is required"),
  flat: z.string().min(1, "Flat is required"),
});

export const importCustomersSchema = z.object({
  slug: z.string(),
  rawText: z.string().min(1, "Please provide customer lines to import"),
});

export const resetCustomerLinkSchema = z.object({
  slug: z.string(),
  customerId: z.string(),
});
