"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { assetMovements, customers, orders } from "@/db/schema";
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

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.vendorId, access.vendorId)))
    .limit(1);

  if (!customer) {
    return { ok: false, error: "Customer not found in this business" };
  }

  if (orderId) {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.vendorId, access.vendorId),
          eq(orders.customerId, customerId)
        )
      )
      .limit(1);

    if (!order) {
      return { ok: false, error: "Order not found for this customer and business" };
    }
  }

  try {
    await db.insert(assetMovements).values({
      vendorId: access.vendorId,
      customerId,
      orderId: orderId ?? null,
      asset,
      delta,
    });

    revalidatePath("/app/" + slug + "/customers/" + customerId);
    revalidatePath("/app/" + slug + "/run");
    revalidatePath("/app/" + slug + "/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to record asset movement. Please try again." };
  }
}
