import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, ledgerEntries, payments, shopOrders } from "@/db/schema";
import { razorpayPaymentKey } from "@/core/ledger";

/**
 * Records a captured Razorpay payment exactly once. Both the browser callback
 * and the webhook call this; whichever arrives second is a no-op.
 * Returns false when the payment row is unknown or the amount does not match.
 */
export async function settlePayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise?: number;
}): Promise<{ ok: boolean; shopOrderId: string | null; bookingId: string | null }> {
  const db = getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, input.razorpayOrderId))
    .limit(1);
  if (!payment) return { ok: false, shopOrderId: null, bookingId: null };
  if (input.amountPaise !== undefined && input.amountPaise !== payment.amountPaise) {
    return { ok: false, shopOrderId: payment.shopOrderId, bookingId: payment.bookingId };
  }

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(payments)
      .set({ status: "paid", razorpayPaymentId: input.razorpayPaymentId, paidAt: new Date(), failureReason: null })
      .where(and(eq(payments.id, payment.id), ne(payments.status, "paid")))
      .returning({ id: payments.id });
    if (!updated) return; // already settled

    if (payment.purpose === "shop_order" && payment.shopOrderId) {
      // Paid: the order now reaches the store. A late payment for an order that
      // was already cancelled is kept as refund_due for admin to return.
      const [order] = await tx
        .select({ status: shopOrders.status })
        .from(shopOrders)
        .where(eq(shopOrders.id, payment.shopOrderId))
        .limit(1);
      const cancelled = order?.status === "cancelled" || order?.status === "rejected";
      await tx
        .update(shopOrders)
        .set({
          paymentStatus: cancelled ? "refund_due" : "paid",
          ...(order?.status === "awaiting_payment" ? { status: "placed" } : {}),
          updatedAt: new Date(),
        })
        .where(eq(shopOrders.id, payment.shopOrderId));
    }

    if (payment.purpose === "booking" && payment.bookingId) {
      // Paid: a held slot becomes a confirmed session. If the hold already ran out
      // and was cancelled, the money is kept as refund_due for admin to return.
      const [booking] = await tx.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, payment.bookingId)).limit(1);
      const cancelled = booking?.status === "cancelled";
      await tx
        .update(bookings)
        .set({
          paymentStatus: cancelled ? "refund_due" : "paid",
          ...(booking?.status === "held" ? { status: "confirmed", heldUntil: null } : {}),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, payment.bookingId));
    }

    if (payment.purpose === "dues") {
      await tx
        .insert(ledgerEntries)
        .values({
          vendorId: payment.vendorId,
          customerId: payment.customerId,
          type: "payment",
          amountPaise: -payment.amountPaise,
          notes: "Paid online via RUXs",
          idempotencyKey: razorpayPaymentKey(input.razorpayPaymentId),
          createdBy: payment.userId,
        })
        .onConflictDoNothing();
    }
  });

  return { ok: true, shopOrderId: payment.shopOrderId, bookingId: payment.bookingId };
}

export async function failPayment(razorpayOrderId: string, reason: string) {
  const db = getDb();
  await db
    .update(payments)
    .set({ status: "failed", failureReason: reason.slice(0, 300) })
    .where(and(eq(payments.razorpayOrderId, razorpayOrderId), eq(payments.status, "created")));
}
