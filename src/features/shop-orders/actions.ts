"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerEntries, shopOrders, vendors } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { canTransition, deliveredLedgerLines, type ShopActor, type ShopOrderStatus } from "@/core/shop";
import { shopChargeKey, shopPaymentKey } from "@/core/ledger";
import { vendorOrderStatusSchema } from "./schemas";

async function moveOrder(opts: {
  orderId: string;
  vendorId: string | null;
  to: ShopOrderStatus;
  actor: ShopActor;
  actorId: string;
  reason?: string;
}) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(shopOrders)
    .where(opts.vendorId ? and(eq(shopOrders.id, opts.orderId), eq(shopOrders.vendorId, opts.vendorId)) : eq(shopOrders.id, opts.orderId))
    .limit(1);
  if (!order) return { ok: false as const, error: "Order not found" };

  const from = order.status as ShopOrderStatus;
  if (!canTransition(from, opts.to, opts.actor)) {
    return { ok: false as const, error: "This order can't move to that status" };
  }

  const now = new Date();
  const result = await db.transaction(async (tx) => {
    // Compare-and-set on the old status so two taps can't both win.
    const [updated] = await tx
      .update(shopOrders)
      .set({
        status: opts.to,
        updatedAt: now,
        ...(opts.to === "accepted" ? { acceptedAt: now } : {}),
        ...(opts.to === "delivered" ? { deliveredAt: now } : {}),
        ...(opts.to === "cancelled" || opts.to === "rejected"
          ? {
              cancelReason: opts.reason || (opts.to === "rejected" ? "The store couldn't take this order" : "Cancelled by the store"),
              // Money taken online goes back to the household; admin issues the refund.
              ...(order.paymentStatus === "paid" ? { paymentStatus: "refund_due" } : {}),
            }
          : {}),
      })
      .where(and(eq(shopOrders.id, order.id), eq(shopOrders.status, from)))
      .returning({ id: shopOrders.id });
    if (!updated) return false;

    if (opts.to === "delivered") {
      for (const line of deliveredLedgerLines(order.totalPaise, order.paymentMode as "cod" | "monthly_bill")) {
        await tx
          .insert(ledgerEntries)
          .values({
            vendorId: order.vendorId,
            customerId: order.customerId,
            type: line.type,
            amountPaise: line.amountPaise,
            notes:
              line.type === "delivery"
                ? `Order ${order.number}`
                : order.paymentMode === "online"
                  ? `Paid online · ${order.number}`
                  : `Paid on delivery · ${order.number}`,
            idempotencyKey: line.type === "delivery" ? shopChargeKey(order.id) : shopPaymentKey(order.id),
            createdBy: opts.actorId,
          })
          .onConflictDoNothing();
      }
    }
    return true;
  });

  if (!result) return { ok: false as const, error: "Someone else just updated this order. Refresh and try again." };

  const [vendor] = await db.select({ slug: vendors.slug }).from(vendors).where(eq(vendors.id, order.vendorId)).limit(1);
  if (vendor) revalidatePath(`/merchant-panel/${vendor.slug}/orders`);
  revalidatePath(`/app/orders/${order.id}`);
  revalidatePath("/app/orders");
  revalidatePath("/admin/orders");
  return { ok: true as const };
}

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
