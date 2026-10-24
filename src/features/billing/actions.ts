"use server";

import { revalidatePath } from "next/cache";
import { requireVendorAccess } from "@/lib/auth/session";
import { generateMonthlyBillsSchema } from "./schemas";
import { generateBillsForVendor } from "./generate-bills";

export async function generateMonthlyBillsAction(input: unknown) {
  const parsed = generateMonthlyBillsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, period } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);

  try {
    const result = await generateBillsForVendor(access.vendorId, period);
    revalidatePath(`/merchant-panel/${slug}/bills`);
    return { ok: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate monthly bills";
    return { ok: false, error: msg };
  }
}
