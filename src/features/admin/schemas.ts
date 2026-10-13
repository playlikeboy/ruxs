import { z } from "zod";

export const vendorStatusActionSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
});
