"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { assetMovements, customers, orders } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { recordAssetMovementSchema } from "./schemas";
import { uploadToImgbb } from "@/lib/imgbb";

export async function uploadImageAction(formData: FormData) {
  const file = formData.get("image");
  if (!file || (typeof file !== "string" && !(file instanceof Blob))) {
    return { ok: false, error: "No image file provided" };
  }
  const name = typeof formData.get("name") === "string" ? String(formData.get("name")) : undefined;
  const res = await uploadToImgbb(file, name);
  if (!res.success || !res.url) {
    return { ok: false, error: res.error || "Upload failed" };
  }
  return { ok: true, url: res.url, displayUrl: res.displayUrl, thumbUrl: res.thumbUrl };
}

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

    revalidatePath("/merchant-panel/" + slug + "/customers/" + customerId);
    revalidatePath("/merchant-panel/" + slug + "/run");
    revalidatePath("/merchant-panel/" + slug + "/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to record asset movement. Please try again." };
  }
}
