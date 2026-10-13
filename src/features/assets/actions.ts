"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { assetMovements } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { recordAssetMovementSchema } from "./schemas";

export async function recordAssetMovement(input: unknown) {
  const parsed = recordAssetMovementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, customerId, asset, delta, orderId } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  try {
    await db.insert(assetMovements).values({
      vendorId: access.vendorId,
      customerId,
      orderId: orderId ?? null,
      asset,
      delta,
    });

    revalidatePath(`/app/${slug}/customers/${customerId}`);
    revalidatePath(`/app/${slug}/run`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record asset movement";
    return { ok: false, error: msg };
  }
}
