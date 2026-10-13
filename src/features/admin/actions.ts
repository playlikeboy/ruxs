"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { vendorStatusActionSchema } from "./schemas";

export async function approveVendor(input: unknown) {
  const parsed = vendorStatusActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireAdmin();
  const db = getDb();

  try {
    const [updated] = await db
      .update(vendors)
      .set({ status: "active" })
      .where(eq(vendors.id, parsed.data.vendorId))
      .returning();

    if (!updated) {
      return { ok: false, error: "Vendor not found" };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve vendor";
    return { ok: false, error: msg };
  }
}

export async function suspendVendor(input: unknown) {
  const parsed = vendorStatusActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireAdmin();
  const db = getDb();

  try {
    const [updated] = await db
      .update(vendors)
      .set({ status: "suspended" })
      .where(eq(vendors.id, parsed.data.vendorId))
      .returning();

    if (!updated) {
      return { ok: false, error: "Vendor not found" };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to suspend vendor";
    return { ok: false, error: msg };
  }
}
