"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, storeCategories, storeOrders, storePayments, storeProducts, storeSettings, storeStockMovements } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { createRazorpayOrder, razorpayKeyId, refundRazorpayPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { STORE_PAYMENT_HOLD_MINUTES, storeSlug } from "@/core/store";
import { addressLine, loadProfile } from "@/features/consumer/household";
import { quoteStoreBag, resolveStoreDeliveryPoint } from "./queries";
import {
  adjustStockSchema,
  confirmStoreCheckoutSchema,
  placeStoreOrderSchema,
  quoteBagSchema,
  refundStoreOrderSchema,
  storeCategorySchema,
  storeOrderIdSchema,
  storeProductIdSchema,
  storeProductSchema,
  storeSettingsSchema,
  updateStoreOrderDetailsSchema,
  updateStoreOrderStatusSchema,
} from "./schemas";
import { adjustStoreStock, placeStoreOrderTx, queueStoreEmail, settleStorePayment, transitionStoreOrder } from "./settle";
import type { StoreActionResult, StoreBagQuote, StoreCheckoutOptions, StoreOrderStatus, StorePaymentMode } from "./types";

const SHOP = "/app/kids/shop";
const ADMIN = "/admin/store";

function fail(error: string) {
  return { ok: false as const, error };
}

function firstIssue(err: { issues: { message: string }[] }, fallback = "Check the details and try again") {
  return err.issues[0]?.message ?? fallback;
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function revalidateShopOrder(orderId: string) {
  revalidatePath(`${SHOP}/orders`);
  revalidatePath(`${SHOP}/orders/${orderId}`);
  revalidatePath(`${ADMIN}/orders`);
  revalidatePath(`${ADMIN}/orders/${orderId}`);
  revalidatePath(ADMIN);
}

function revalidateCatalog() {
  revalidatePath(SHOP, "layout");
  revalidatePath(`${ADMIN}/products`);
  revalidatePath(ADMIN);
}

// ─── Household ───────────────────────────────────────────────────────

/** Re-prices the localStorage bag on the server, with stock and delivery checks. */
export async function quoteMyStoreBag(input: unknown): Promise<StoreActionResult<{ quote: StoreBagQuote }>> {
  const parsed = quoteBagSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, "Your bag could not be read"));
  const user = await requireUser();
  return { ok: true, quote: await quoteStoreBag(parsed.data.items, { userId: user.id }) };
}

/**
 * Places a RUXs Store order. Prices and stock come from the database; the
 * address must be inside the store's delivery area. Safe to repeat with the
 * same clientKey. Online orders come back awaiting payment: call
 * startStoreOrderPayment next.
 */
export async function placeStoreOrder(
  input: unknown
): Promise<StoreActionResult<{ orderId: string; orderNumber: string; status: StoreOrderStatus; paymentMode: StorePaymentMode; needsPayment: boolean }>> {
  const parsed = placeStoreOrderSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, "Invalid order"));
  const user = await requireUser();
  const profile = await loadProfile(user.id);
  if (!profile) return fail("Add your delivery address before placing an order");

  const data = parsed.data;
  // Online orders hold stock until paid: don't take one when Razorpay is not configured.
  if (data.paymentMode === "online" && !razorpayKeyId()) return fail("Online payment is not available right now. Choose pay on delivery.");
  const result = await placeStoreOrderTx(getDb(), {
    userId: user.id,
    clientKey: data.clientKey,
    items: data.items,
    paymentMode: data.paymentMode,
    notes: data.notes ?? null,
    contact: { name: profile.name, phone: profile.phone, address: addressLine(profile) },
    point: await resolveStoreDeliveryPoint(profile),
  });
  if (!result.ok) return result;

  revalidateShopOrder(result.orderId);
  revalidateCatalog();
  if (result.created && result.status === "placed") queueStoreEmail(result.orderId, "placed");
  return {
    ok: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    status: result.status,
    paymentMode: result.paymentMode,
    needsPayment: result.status === "awaiting_payment",
  };
}

/** Opens (or re-opens) Razorpay checkout for one of my unpaid online store orders. */
export async function startStoreOrderPayment(input: unknown): Promise<StoreActionResult<{ checkout: StoreCheckoutOptions }>> {
  const parsed = storeOrderIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid order");
  const user = await requireUser();
  const keyId = razorpayKeyId();
  if (!keyId) return fail("Online payment is not available right now");
  const db = getDb();

  const [order] = await db
    .select()
    .from(storeOrders)
    .where(and(eq(storeOrders.id, parsed.data.orderId), eq(storeOrders.userId, user.id)))
    .limit(1);
  if (!order) return fail("Order not found");
  if (order.paymentMode !== "online" || order.status !== "awaiting_payment") return fail("This order does not need payment");
  // After the hold the cron tick releases the stock; a payment then would only need refunding.
  if (order.createdAt.getTime() + STORE_PAYMENT_HOLD_MINUTES * 60_000 <= Date.now()) {
    return fail("The payment window for this order has ended. Please place the order again.");
  }

  // Reuse an open Razorpay order so retries don't create duplicates.
  const [existing] = await db
    .select()
    .from(storePayments)
    .where(and(eq(storePayments.orderId, order.id), eq(storePayments.status, "created")))
    .limit(1);
  let razorpayOrderId = existing?.razorpayOrderId;
  if (!razorpayOrderId) {
    try {
      const rzp = await createRazorpayOrder({
        amountPaise: order.totalPaise,
        receipt: order.orderNumber,
        notes: { store_order_id: order.id, purpose: "ruxs_store" },
      });
      razorpayOrderId = rzp.id;
    } catch {
      return fail("Could not start the payment. Please try again.");
    }
    await db.insert(storePayments).values({
      orderId: order.id,
      userId: user.id,
      razorpayOrderId,
      amountPaise: order.totalPaise,
    });
  }

  const [p] = await db.select().from(consumers).where(eq(consumers.userId, user.id)).limit(1);
  return {
    ok: true,
    checkout: {
      keyId,
      razorpayOrderId,
      amountPaise: order.totalPaise,
      description: `RUXs Store · ${order.orderNumber}`,
      prefill: { name: p?.name ?? order.customerName, email: user.primaryEmail ?? p?.email ?? "", contact: p?.phone ?? order.phone },
    },
  };
}

/** Browser callback after Razorpay checkout succeeds. The webhook is the backup. */
export async function confirmStoreCheckout(input: unknown): Promise<StoreActionResult<{ orderId: string }>> {
  const parsed = confirmStoreCheckoutSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid payment response");
  const user = await requireUser();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
  if (!verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) return fail("Payment could not be verified");

  const db = getDb();
  const [mine] = await db
    .select({ id: storePayments.id })
    .from(storePayments)
    .where(and(eq(storePayments.razorpayOrderId, razorpayOrderId), eq(storePayments.userId, user.id)))
    .limit(1);
  if (!mine) return fail("Payment not found");

  const result = await settleStorePayment({ razorpayOrderId, razorpayPaymentId }, db);
  if (!result.handled || !result.ok) return fail("Payment could not be recorded. If money was taken, it will be refunded.");
  revalidateShopOrder(result.orderId);
  return { ok: true, orderId: result.orderId };
}

/** Cancels my order before it is packed. Stock goes back; a paid order becomes refund_due. */
export async function cancelMyStoreOrder(input: unknown): Promise<StoreActionResult> {
  const parsed = storeOrderIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid order");
  const user = await requireUser();
  const r = await transitionStoreOrder(getDb(), {
    orderId: parsed.data.orderId,
    to: "cancelled",
    actor: "customer",
    actorId: user.id,
    userId: user.id,
  });
  if (!r.ok) return r;
  revalidateShopOrder(r.orderId);
  revalidateCatalog();
  return { ok: true };
}

// ─── Admin: catalog ──────────────────────────────────────────────────

/** Creates (no id) or updates a product. Stock is only set on create; later use adjustStock. */
export async function saveStoreProduct(input: unknown): Promise<StoreActionResult<{ id: string; slug: string }>> {
  const parsed = storeProductSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const { id, slug: rawSlug, initialStock, ...data } = parsed.data;
  const slug = rawSlug || storeSlug(data.name);
  if (!slug) return fail("Add a name with letters or numbers");

  const [cat] = await db.select({ id: storeCategories.id }).from(storeCategories).where(eq(storeCategories.id, data.categoryId)).limit(1);
  if (!cat) return fail("Pick a category");

  const now = new Date();
  try {
    if (id) {
      const [row] = await db
        .update(storeProducts)
        .set({ ...data, slug, updatedAt: now })
        .where(eq(storeProducts.id, id))
        .returning({ id: storeProducts.id });
      if (!row) return fail("Product not found");
    } else {
      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(storeProducts)
          .values({ ...data, slug, stock: initialStock, createdAt: now, updatedAt: now })
          .returning({ id: storeProducts.id });
        if (initialStock > 0) {
          await tx.insert(storeStockMovements).values({
            productId: row!.id,
            delta: initialStock,
            stockAfter: initialStock,
            reason: "restock",
            actor: user.id,
            note: "Opening stock",
            createdAt: now,
          });
        }
        return row!.id;
      });
      revalidateCatalog();
      return { ok: true, id: created, slug };
    }
  } catch (err) {
    if (isUniqueViolation(err)) return fail("Another product already uses this slug or SKU");
    console.error("[store] save product failed", err instanceof Error ? err.message : err);
    return fail("Could not save the product. Please try again.");
  }
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${id}`);
  revalidatePath(`${SHOP}/p/${slug}`);
  return { ok: true, id, slug };
}

/** Hides a product everywhere. Orders keep referring to it. */
export async function archiveStoreProduct(input: unknown): Promise<StoreActionResult> {
  const parsed = storeProductIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid product");
  await requireAdmin();
  const [row] = await getDb()
    .update(storeProducts)
    .set({ archivedAt: new Date(), isFeatured: false, updatedAt: new Date() })
    .where(and(eq(storeProducts.id, parsed.data.productId), isNull(storeProducts.archivedAt)))
    .returning({ id: storeProducts.id });
  if (!row) return fail("Product not found or already archived");
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${row.id}`);
  return { ok: true };
}

/** Brings an archived product back (inactive, so it can be checked before going live). */
export async function restoreStoreProduct(input: unknown): Promise<StoreActionResult> {
  const parsed = storeProductIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid product");
  await requireAdmin();
  const [row] = await getDb()
    .update(storeProducts)
    .set({ archivedAt: null, isActive: false, updatedAt: new Date() })
    .where(eq(storeProducts.id, parsed.data.productId))
    .returning({ id: storeProducts.id });
  if (!row) return fail("Product not found");
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${row.id}`);
  return { ok: true };
}

/** Restock (+) or correct (±) a product's stock; logged as a stock movement. */
export async function adjustStock(input: unknown): Promise<StoreActionResult<{ stock: number }>> {
  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const r = await adjustStoreStock(getDb(), { ...parsed.data, actor: user.id });
  if (!r.ok) return r;
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${parsed.data.productId}`);
  return { ok: true, stock: r.stock };
}

/** Creates or updates a category by its slug id. */
export async function saveStoreCategory(input: unknown): Promise<StoreActionResult<{ id: string }>> {
  const parsed = storeCategorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const { icon, ...rest } = parsed.data;
  const values = { ...rest, emojiIcon: icon, updatedAt: new Date() };
  await getDb()
    .insert(storeCategories)
    .values(values)
    .onConflictDoUpdate({ target: storeCategories.id, set: { name: values.name, description: values.description, emojiIcon: icon, sort: values.sort, isActive: values.isActive, updatedAt: values.updatedAt } });
  revalidatePath(`${ADMIN}/categories`);
  revalidateCatalog();
  return { ok: true, id: parsed.data.id };
}

// ─── Admin: orders ───────────────────────────────────────────────────

/** packed → out_for_delivery → delivered, cancel before dispatch (restocks), returned. */
export async function updateStoreOrderStatus(input: unknown): Promise<StoreActionResult<{ status: StoreOrderStatus }>> {
  const parsed = updateStoreOrderStatusSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const d = parsed.data;
  const r = await transitionStoreOrder(getDb(), {
    orderId: d.orderId,
    to: d.to,
    actor: "admin",
    actorId: user.id,
    cancelReason: d.cancelReason,
    courier: d.courier,
    trackingNumber: d.trackingNumber,
  });
  if (!r.ok) return r;
  revalidateShopOrder(r.orderId);
  if (r.restocked) revalidateCatalog();
  return { ok: true, status: r.to };
}

/** Courier, tracking number and internal note, without changing status. */
export async function updateStoreOrderDetails(input: unknown): Promise<StoreActionResult> {
  const parsed = updateStoreOrderDetailsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const d = parsed.data;
  const [row] = await getDb()
    .update(storeOrders)
    .set({ courier: d.courier || null, trackingNumber: d.trackingNumber || null, adminNote: d.adminNote || null, updatedAt: new Date() })
    .where(eq(storeOrders.id, d.orderId))
    .returning({ id: storeOrders.id });
  if (!row) return fail("Order not found");
  revalidateShopOrder(row.id);
  return { ok: true };
}

/**
 * Refunds a cancelled or returned order. Online: through Razorpay (full amount
 * of the captured payment). COD: records that the cash was returned by hand.
 */
export async function refundStoreOrder(input: unknown): Promise<StoreActionResult<{ refundId: string | null }>> {
  const parsed = refundStoreOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid order");
  const { user } = await requireAdmin();
  const db = getDb();
  const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, parsed.data.orderId)).limit(1);
  if (!order) return fail("Order not found");
  if (order.status !== "cancelled" && order.status !== "returned") return fail("Cancel the order or mark it returned first");
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "refund_due") return fail("Nothing to refund on this order");

  // Claim the refund first so a double click can't refund twice.
  const previous = order.paymentStatus;
  const [claimed] = await db
    .update(storeOrders)
    .set({ paymentStatus: "refunded", updatedAt: new Date() })
    .where(and(eq(storeOrders.id, order.id), inArray(storeOrders.paymentStatus, ["paid", "refund_due"])))
    .returning({ id: storeOrders.id });
  if (!claimed) return fail("This order was already refunded");

  let refundId: string | null = null;
  if (order.paymentMode === "online") {
    const [payment] = await db
      .select()
      .from(storePayments)
      .where(and(eq(storePayments.orderId, order.id), eq(storePayments.status, "paid"), isNull(storePayments.refundId)))
      .limit(1);
    if (!payment?.razorpayPaymentId) {
      // Nothing captured to refund through Razorpay: undo the claim instead of marking it refunded.
      await db
        .update(storeOrders)
        .set({ paymentStatus: previous, updatedAt: new Date() })
        .where(and(eq(storeOrders.id, order.id), eq(storeOrders.paymentStatus, "refunded")));
      return fail("No captured online payment found for this order");
    }
    try {
      const note = parsed.data.note || `RUXs Store ${order.orderNumber} refund by ${user.id}`;
      const refund = await refundRazorpayPayment(payment.razorpayPaymentId, payment.amountPaise, note);
      refundId = refund.id;
      await db.update(storePayments).set({ refundId, refundedAt: new Date() }).where(eq(storePayments.id, payment.id));
    } catch (err) {
      await db
        .update(storeOrders)
        .set({ paymentStatus: previous, updatedAt: new Date() })
        .where(and(eq(storeOrders.id, order.id), eq(storeOrders.paymentStatus, "refunded")));
      return fail(err instanceof Error ? err.message : "Razorpay refund failed");
    }
  }
  if (parsed.data.note) {
    await db
      .update(storeOrders)
      .set({ adminNote: [order.adminNote, `Refund: ${parsed.data.note}`].filter(Boolean).join("\n") })
      .where(eq(storeOrders.id, order.id));
  }
  revalidateShopOrder(order.id);
  return { ok: true, refundId };
}

// ─── Admin: settings ─────────────────────────────────────────────────

export async function saveStoreSettings(input: unknown): Promise<StoreActionResult> {
  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const d = parsed.data;
  const values = { ...d, closedMessage: d.closedMessage || null, updatedBy: user.id, updatedAt: new Date() };
  await getDb().insert(storeSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: storeSettings.id, set: values });
  revalidatePath(`${ADMIN}/settings`);
  revalidatePath(ADMIN);
  revalidatePath(SHOP, "layout");
  return { ok: true };
}

