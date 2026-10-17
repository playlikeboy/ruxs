"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, payments, shopOrders, vendorPayouts, vendors } from "@/db/schema";
import { requireAdmin, requireVendorAccess } from "@/lib/auth/session";
import { refundRazorpayPayment } from "@/lib/razorpay";
import { todayIST } from "@/core/time";
import { computeVendorBalance } from "./queries";

function fail(error: string) {
  return { ok: false as const, error };
}

function revalidateMoney(slug?: string) {
  revalidatePath("/admin/payouts");
  if (slug) revalidatePath(`/merchant-panel/${slug}/earnings`);
}

/** Owner asks RUXs to send the whole available balance. One open request at a time. */
export async function requestWithdrawal(input: unknown) {
  const parsed = z.object({ slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return fail("Invalid request");

  const access = await requireVendorAccess(parsed.data.slug, ["owner"]);
  const db = getDb();

  const [open] = await db
    .select({ id: vendorPayouts.id })
    .from(vendorPayouts)
    .where(and(eq(vendorPayouts.vendorId, access.vendorId), eq(vendorPayouts.status, "requested")))
    .limit(1);
  if (open) return fail("You already have a withdrawal request in progress");

  const balance = await computeVendorBalance(access.vendorId, access.vendor.commissionBps);
  if (balance.availablePaise < 100) return fail("Nothing to withdraw yet");

  await db.insert(vendorPayouts).values({
    vendorId: access.vendorId,
    amountPaise: balance.availablePaise,
    period: todayIST().slice(0, 7),
    requestedBy: access.user.id,
  });
  revalidateMoney(parsed.data.slug);
  return { ok: true as const };
}

/** After sending the money manually (UPI/NEFT), admin records the transfer reference. */
export async function adminMarkPayoutPaid(input: unknown) {
  const parsed = z.object({ payoutId: z.string().min(1), reference: z.string().trim().min(3, "Enter the UTR / transfer reference").max(80) }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const { user } = await requireAdmin();
  const db = getDb();
  const [updated] = await db
    .update(vendorPayouts)
    .set({ status: "paid", reference: parsed.data.reference, processedBy: user.id, processedAt: new Date() })
    .where(and(eq(vendorPayouts.id, parsed.data.payoutId), eq(vendorPayouts.status, "requested")))
    .returning({ vendorId: vendorPayouts.vendorId });
  if (!updated) return fail("This request was already processed");

  const [v] = await db.select({ slug: vendors.slug }).from(vendors).where(eq(vendors.id, updated.vendorId)).limit(1);
  revalidateMoney(v?.slug);
  return { ok: true as const };
}

export async function adminRejectPayout(input: unknown) {
  const parsed = z.object({ payoutId: z.string().min(1), note: z.string().trim().max(200).optional() }).safeParse(input);
  if (!parsed.success) return fail("Invalid input");

  const { user } = await requireAdmin();
  const db = getDb();
  const [updated] = await db
    .update(vendorPayouts)
    .set({ status: "rejected", note: parsed.data.note || null, processedBy: user.id, processedAt: new Date() })
    .where(and(eq(vendorPayouts.id, parsed.data.payoutId), eq(vendorPayouts.status, "requested")))
    .returning({ vendorId: vendorPayouts.vendorId });
  if (!updated) return fail("This request was already processed");

  const [v] = await db.select({ slug: vendors.slug }).from(vendors).where(eq(vendors.id, updated.vendorId)).limit(1);
  revalidateMoney(v?.slug);
  return { ok: true as const };
}

/** Admin pays a vendor's full available balance without waiting for a request. */
export async function adminRecordPayout(input: unknown) {
  const parsed = z.object({ vendorId: z.string().min(1), reference: z.string().trim().min(3, "Enter the UTR / transfer reference").max(80) }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const { user } = await requireAdmin();
  const db = getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, parsed.data.vendorId)).limit(1);
  if (!vendor) return fail("Vendor not found");

  const balance = await computeVendorBalance(vendor.id, vendor.commissionBps);
  if (balance.availablePaise < 100) return fail("Nothing available to pay out");

  const now = new Date();
  await db.insert(vendorPayouts).values({
    vendorId: vendor.id,
    amountPaise: balance.availablePaise,
    status: "paid",
    period: todayIST().slice(0, 7),
    requestedBy: user.id,
    processedBy: user.id,
    processedAt: now,
    reference: parsed.data.reference,
  });
  revalidateMoney(vendor.slug);
  return { ok: true as const };
}

/** Full refund through Razorpay for a paid online order that was cancelled or declined. */
export async function adminRefundShopOrder(input: unknown) {
  const parsed = z.object({ orderId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return fail("Invalid input");

  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ order: shopOrders, payment: payments })
    .from(shopOrders)
    .innerJoin(payments, and(eq(payments.shopOrderId, shopOrders.id), eq(payments.status, "paid")))
    .where(and(eq(shopOrders.id, parsed.data.orderId), eq(shopOrders.paymentStatus, "refund_due")))
    .limit(1);
  if (!row || !row.payment.razorpayPaymentId) return fail("No refund is due for this order");

  try {
    await refundRazorpayPayment(row.payment.razorpayPaymentId, row.payment.amountPaise, `RUXs order ${row.order.number}`);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Refund failed");
  }
  await db
    .update(shopOrders)
    .set({ paymentStatus: "refunded", updatedAt: new Date() })
    .where(eq(shopOrders.id, row.order.id));
  revalidatePath("/admin/payouts");
  revalidatePath(`/app/orders/${row.order.id}`);
  return { ok: true as const };
}

/** Full refund through Razorpay for a paid online booking that was cancelled. */
export async function adminRefundBooking(input: unknown) {
  const parsed = z.object({ bookingId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return fail("Invalid input");

  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, payment: payments })
    .from(bookings)
    .innerJoin(payments, and(eq(payments.bookingId, bookings.id), eq(payments.status, "paid")))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.paymentStatus, "refund_due")))
    .limit(1);
  if (!row || !row.payment.razorpayPaymentId) return fail("No refund is due for this booking");

  try {
    await refundRazorpayPayment(row.payment.razorpayPaymentId, row.payment.amountPaise, `RUXs booking ${row.booking.number}`);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Refund failed");
  }
  await db.update(bookings).set({ paymentStatus: "refunded", updatedAt: new Date() }).where(eq(bookings.id, row.booking.id));
  revalidatePath("/admin/payouts");
  revalidatePath(`/app/bookings/${row.booking.id}`);
  return { ok: true as const };
}
