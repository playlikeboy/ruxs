import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, customers, ledgerEntries, payments, services, shopOrders, vendors } from "@/db/schema";
import { notifyAfter, notifyVendorAfter } from "@/features/notifications/dispatch";
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

  let firstSettle = false;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(payments)
      .set({ status: "paid", razorpayPaymentId: input.razorpayPaymentId, paidAt: new Date(), failureReason: null })
      .where(and(eq(payments.id, payment.id), ne(payments.status, "paid")))
      .returning({ id: payments.id });
    if (!updated) return; // already settled
    firstSettle = true;

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

  if (firstSettle) await announcePaid(payment);
  return { ok: true, shopOrderId: payment.shopOrderId, bookingId: payment.bookingId };
}

/** A paid order or booking now reaches the store: tell both sides once. */
async function announcePaid(payment: typeof payments.$inferSelect) {
  const db = getDb();
  if (payment.purpose === "shop_order" && payment.shopOrderId) {
    const [row] = await db
      .select({ order: shopOrders, vendorName: vendors.name, slug: vendors.slug, customerName: customers.name })
      .from(shopOrders)
      .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
      .innerJoin(customers, eq(shopOrders.customerId, customers.id))
      .where(eq(shopOrders.id, payment.shopOrderId))
      .limit(1);
    if (!row || row.order.status !== "placed") return;
    notifyAfter([row.order.userId], { kind: "customer.order.paid", number: row.order.number, vendorName: row.vendorName, orderId: row.order.id });
    notifyVendorAfter(row.order.vendorId, { kind: "vendor.order.paid", slug: row.slug, number: row.order.number, customerName: row.customerName, totalPaise: row.order.totalPaise });
  }
  if (payment.purpose === "booking" && payment.bookingId) {
    const [row] = await db
      .select({ booking: bookings, vendorName: vendors.name, slug: vendors.slug, customerName: customers.name, serviceName: services.name })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, payment.bookingId))
      .limit(1);
    if (!row || row.booking.status !== "confirmed") return;
    const serviceName = row.serviceName ?? "Session";
    notifyAfter([row.booking.userId], { kind: "customer.booking.confirmed", number: row.booking.number, serviceName, vendorName: row.vendorName, startsAt: row.booking.startsAt });
    notifyVendorAfter(row.booking.vendorId, { kind: "vendor.booking.new", slug: row.slug, number: row.booking.number, customerName: row.customerName, serviceName, startsAt: row.booking.startsAt });
  }
}

export async function failPayment(razorpayOrderId: string, reason: string) {
  const db = getDb();
  await db
    .update(payments)
    .set({ status: "failed", failureReason: reason.slice(0, 300) })
    .where(and(eq(payments.razorpayOrderId, razorpayOrderId), eq(payments.status, "created")));
}
