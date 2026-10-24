import "server-only";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerEntries, shopOrders, vendors } from "@/db/schema";
import { canTransition, deliveredLedgerLines, type ShopActor, type ShopOrderStatus } from "@/core/shop";
import { shopChargeKey, shopPaymentKey } from "@/core/ledger";
import { notifyAfter, notifyVendorAfter } from "@/features/notifications/dispatch";

const CUSTOMER_VISIBLE = ["accepted", "rejected", "out_for_delivery", "delivered", "cancelled"] as const;
type CustomerVisible = (typeof CUSTOMER_VISIBLE)[number];

/** The store moved the order: tell the household. The household cancelled: tell the store. */
function notifyOrderMove(
  order: typeof shopOrders.$inferSelect,
  finalStatus: ShopOrderStatus,
  opts: { actor: ShopActor; reason?: string },
  vendor: { slug: string; name: string }
) {
  if (opts.actor === "consumer") {
    if (finalStatus === "cancelled") {
      notifyVendorAfter(order.vendorId, { kind: "vendor.order.cancelled", slug: vendor.slug, number: order.number, customerName: "A customer" });
    }
    return;
  }
  if (!(CUSTOMER_VISIBLE as readonly string[]).includes(finalStatus) || finalStatus === order.status) return;
  notifyAfter(
    [order.userId],
    { kind: "customer.order.status", number: order.number, vendorName: vendor.name, orderId: order.id, status: finalStatus as CustomerVisible, reason: opts.reason },
    { onceKey: `order:${order.id}:${finalStatus}` }
  );
}

/**
 * The one place an app order changes status. Compare-and-set on the old status,
 * ledger lines on delivery and a refund flag on cancel.
 */
export async function moveOrder(opts: {
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
  const isMarkingDelivered = opts.to === "delivered";

  let finalStatus: ShopOrderStatus = opts.to;
  let vendorDeliveredAt = order.vendorDeliveredAt;
  let consumerDeliveredAt = order.consumerDeliveredAt;
  let deliveredAt = order.deliveredAt;

  if (isMarkingDelivered) {
    if (opts.actor === "vendor") {
      vendorDeliveredAt = now;
      if (consumerDeliveredAt) {
        finalStatus = "delivered";
        deliveredAt = now;
      } else {
        // Awaiting consumer confirmation; keep active order visible as out_for_delivery
        finalStatus = from === "accepted" ? "out_for_delivery" : from;
      }
    } else if (opts.actor === "consumer") {
      consumerDeliveredAt = now;
      if (vendorDeliveredAt) {
        finalStatus = "delivered";
        deliveredAt = now;
      } else {
        // Awaiting vendor confirmation; keep active order visible as out_for_delivery
        finalStatus = from === "accepted" ? "out_for_delivery" : from;
      }
    } else if (opts.actor === "admin") {
      vendorDeliveredAt = vendorDeliveredAt ?? now;
      consumerDeliveredAt = consumerDeliveredAt ?? now;
      finalStatus = "delivered";
      deliveredAt = now;
    }
  }

  const result = await db.transaction(async (tx) => {
    // Compare-and-set on the old status so two taps can't both win.
    const [updated] = await tx
      .update(shopOrders)
      .set({
        status: finalStatus,
        updatedAt: now,
        ...(opts.to === "accepted" ? { acceptedAt: now } : {}),
        ...(isMarkingDelivered
          ? {
              vendorDeliveredAt,
              consumerDeliveredAt,
              ...(finalStatus === "delivered" ? { deliveredAt } : {}),
            }
          : {}),
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

    if (finalStatus === "delivered") {
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

  const [vendor] = await db.select({ slug: vendors.slug, name: vendors.name }).from(vendors).where(eq(vendors.id, order.vendorId)).limit(1);
  if (vendor) revalidatePath(`/merchant-panel/${vendor.slug}/orders`);
  if (vendor) notifyOrderMove(order, finalStatus, opts, vendor);
  revalidatePath(`/app/orders/${order.id}`);
  revalidatePath("/app/orders");
  revalidatePath("/admin/orders");

  return {
    ok: true as const,
    finalStatus,
    isDelivered: finalStatus === "delivered",
    waitingFor:
      isMarkingDelivered && finalStatus !== "delivered"
        ? opts.actor === "vendor"
          ? "consumer"
          : "vendor"
        : null,
  };
}

