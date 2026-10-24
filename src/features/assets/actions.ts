"use server";

import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { assetMovements, customers, orders, vendorMembers } from "@/db/schema";
import { isUserAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { validateImageUpload } from "@/core/media";
import { recordAssetMovementSchema } from "./schemas";
import { uploadToImgbb } from "@/lib/imgbb";

/** Merchant owners/staff and platform admins upload listing photos and certificates. */
export async function uploadImageAction(formData: FormData) {
  const user = await requireUser();
  const [member] = await getDb()
    .select({ vendorId: vendorMembers.vendorId })
    .from(vendorMembers)
    .where(and(eq(vendorMembers.userId, user.id), inArray(vendorMembers.role, ["owner", "staff"])))
    .limit(1);
  if (!member && !(await isUserAdmin(user))) {
    return { ok: false, error: "Only store owners and staff can upload images." };
  }
  const file = formData.get("image");
  if (!(file instanceof Blob)) {
    return { ok: false, error: "No image file provided" };
  }
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const check = validateImageUpload({ type: file.type, size: file.size, head });
  if (!check.ok) return { ok: false, error: check.error };
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.replace(/[^\w.\- ]/g, "").slice(0, 50) : undefined;
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
