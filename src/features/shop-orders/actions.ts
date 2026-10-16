"use server";

import { requireVendorAccess } from "@/lib/auth/session";
import { moveOrder } from "./lifecycle";
import { vendorOrderStatusSchema } from "./schemas";

export async function updateShopOrderStatus(input: unknown) {
  const parsed = vendorOrderStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid request" };

  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff", "driver"]);
  // Drivers only hand over orders; accepting or declining is for the kitchen.
  if (access.role === "driver" && !["out_for_delivery", "delivered"].includes(parsed.data.to)) {
    return { ok: false as const, error: "Drivers can only mark orders out for delivery or delivered" };
  }
  return moveOrder({
    orderId: parsed.data.orderId,
    vendorId: access.vendorId,
    to: parsed.data.to,
    actor: "vendor",
    actorId: access.user.id,
    reason: parsed.data.reason,
  });
}
