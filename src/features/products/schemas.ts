import { z } from "zod";

export const saveProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  kind: z.enum(["tiffin", "water"]),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  shift: z.enum(["lunch", "dinner", "morning", "evening"]),
  priceRupees: z.number().positive("Price must be greater than zero"),
  depositRupees: z.number().nonnegative().default(0),
  assetName: z.string().optional(),
  pollAt: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM").optional(),
  cutoffAt: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM"),
  lateRule: z.enum(["free", "half", "full", "locked"]).default("full"),
});
