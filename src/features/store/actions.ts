"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, storeCategories, storeOrders, storePayments, storeProducts, storeSettings, storeStockMovements } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { createRazorpayOrder, razorpayKeyId, verifyCheckoutSignature } from "@/lib/razorpay";
import { STORE_PAYMENT_HOLD_MINUTES, storeSlug } from "@/core/store";
import { loadProfile } from "@/features/consumer/household";
import { writeStoreAudit } from "./audit";
import { setStockAlertCore, setWishlistCore, submitStoreReviewCore } from "./engagement";
import { queueAutoForward } from "./fulfilment";
import { quoteStoreBag, resolveStoreDeliveryPoint } from "./queries";
import { requestStoreReturnCore } from "./returns";
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
  storeReturnRequestSchema,
  storeReviewSchema,
  storeSettingsSchema,
  updateStoreOrderDetailsSchema,
  updateStoreOrderStatusSchema,
} from "./schemas";
import { loadStoreSettings } from "./settings";
import { adjustStoreStock, placeStoreOrderTx, queueStoreEmail, refundStoreOrderCore, settleStorePayment, transitionStoreOrder } from "./settle";
import type { StoreActionResult, StoreBagQuote, StoreCheckoutOptions, StoreOrderStatus, StorePaymentMode, StoreReviewStatus } from "./types";

const SHOP = "/app/kids/shop";
const ADMIN = "/seller-portal"; // the store back office lives here, not under /admin

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

/**
 * Re-prices the localStorage bag on the server: stock, delivery by PIN code
 * (fee, estimate, COD) and the coupon. Input: { items, pincode?, state?, couponCode? }.
 */
export async function quoteMyStoreBag(input: unknown): Promise<StoreActionResult<{ quote: StoreBagQuote }>> {
  const parsed = quoteBagSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, "Your bag could not be read"));
  const user = await requireUser();
  const { items, pincode, state, couponCode } = parsed.data;
  return { ok: true, quote: await quoteStoreBag(items, { userId: user.id, pincode, state, couponCode }) };
}

/**
 * Places a RUXs Store order. Input: { clientKey, items, paymentMode, shipping
 * { name, phone, line1, line2?, landmark?, city, state, pincode }, couponCode?,
 * expectedTotalPaise?, notes? }. Prices, stock, delivery fee and the coupon all
 * come from the database. Safe to repeat with the same clientKey. Online orders
 * come back awaiting payment: call startStoreOrderPayment next.
 */
export async function placeStoreOrder(
  input: unknown
): Promise<
  StoreActionResult<{ orderId: string; orderNumber: string; status: StoreOrderStatus; paymentMode: StorePaymentMode; totalPaise: number; needsPayment: boolean }>
> {
  const parsed = placeStoreOrderSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, "Invalid order"));
  const user = await requireUser();
  const db = getDb();
  const data = parsed.data;
  const [profile, settings] = await Promise.all([loadProfile(user.id), loadStoreSettings(db)]);
  // Only the one-city mode needs the saved location; pan-India orders carry their own address.
  if (settings.serviceability === "geofence" && !profile) return fail("Add your delivery address before placing an order");

  // Online orders hold stock until paid: don't take one when Razorpay is not configured.
  if (data.paymentMode === "online" && !razorpayKeyId()) return fail("Online payment is not available right now. Choose pay on delivery.");
  const result = await placeStoreOrderTx(db, {
    userId: user.id,
    clientKey: data.clientKey,
    items: data.items,
    paymentMode: data.paymentMode,
    notes: data.notes ?? null,
    shipping: data.shipping,
    email: user.primaryEmail ?? profile?.email ?? null,
    couponCode: data.couponCode ?? null,
    expectedTotalPaise: data.expectedTotalPaise,
    point: settings.serviceability === "geofence" && profile ? await resolveStoreDeliveryPoint(profile) : null,
  });
  if (!result.ok) return result;

  revalidateShopOrder(result.orderId);
  revalidateCatalog();
  if (result.created && result.status === "placed") {
    queueStoreEmail(result.orderId, "placed");
    queueAutoForward(result.orderId);
  }
  return {
    ok: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    status: result.status,
    paymentMode: result.paymentMode,
    totalPaise: result.totalPaise,
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
    // Two taps at once would each open a checkout for the same order, and paying
    // both captures the money twice. The lock makes the second tap reuse the first.
    const created = razorpayOrderId;
    razorpayOrderId = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${"pay:store:" + order.id}))`);
      const [open] = await tx
        .select({ razorpayOrderId: storePayments.razorpayOrderId })
        .from(storePayments)
        .where(and(eq(storePayments.orderId, order.id), eq(storePayments.status, "created")))
        .limit(1);
      if (open) return open.razorpayOrderId;
      await tx.insert(storePayments).values({ orderId: order.id, userId: user.id, razorpayOrderId: created, amountPaise: order.totalPaise });
      return created;
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

/**
 * Rates a product I bought. Input: { productId, rating 1-5, title?, body? }.
 * Needs a delivered order containing it. A new or edited review is `pending`
 * until an admin publishes it.
 */
export async function submitStoreReview(input: unknown): Promise<StoreActionResult<{ reviewId: string; status: StoreReviewStatus }>> {
  const parsed = storeReviewSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const user = await requireUser();
  const r = await submitStoreReviewCore(getDb(), { userId: user.id, ...parsed.data });
  if (!r.ok) return r;
  revalidatePath(`${SHOP}/orders`, "layout");
  revalidatePath(`${ADMIN}/reviews`);
  return r;
}

/** Saves or removes a product from my wishlist. Input: { productId, on? } (`on` omitted = toggle). */
export async function toggleStoreWishlist(input: unknown): Promise<StoreActionResult<{ wishlisted: boolean }>> {
  const parsed = z.object({ productId: z.string().trim().min(1).max(64), on: z.boolean().optional() }).safeParse(input);
  if (!parsed.success) return fail("Invalid product");
  const user = await requireUser();
  const r = await setWishlistCore(getDb(), { userId: user.id, ...parsed.data });
  if (r.ok) revalidatePath(`${SHOP}/wishlist`);
  return r;
}

/** "Tell me when it's back": one email when a sold-out product is restocked. Input: { productId, on }. */
export async function setStoreStockAlert(input: unknown): Promise<StoreActionResult<{ subscribed: boolean }>> {
  const parsed = z.object({ productId: z.string().trim().min(1).max(64), on: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("Invalid product");
  const user = await requireUser();
  const db = getDb();
  let email: string | null = user.primaryEmail ?? null;
  if (!email && parsed.data.on) email = (await loadProfile(user.id))?.email ?? null;
  const r = await setStockAlertCore(db, { userId: user.id, productId: parsed.data.productId, email, on: parsed.data.on });
  if (r.ok) revalidatePath(`${SHOP}/wishlist`);
  return r;
}

/** Asks to return a delivered order of mine, inside the return window. Input: { orderId, reason }. */
export async function requestStoreReturn(input: unknown): Promise<StoreActionResult<{ returnId: string }>> {
  const parsed = storeReturnRequestSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const user = await requireUser();
  const r = await requestStoreReturnCore(getDb(), { orderId: parsed.data.orderId, userId: user.id, reason: parsed.data.reason });
  if (!r.ok) return r;
  revalidateShopOrder(parsed.data.orderId);
  revalidatePath(`${ADMIN}/returns`);
  return r;
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
      await writeStoreAudit(db, { actorUserId: user.id, action: "product.update", entity: "product", entityId: id, data: { sku: data.sku, name: data.name, pricePaise: data.pricePaise, isActive: data.isActive } });
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
        await writeStoreAudit(
          tx,
          { actorUserId: user.id, action: "product.create", entity: "product", entityId: row!.id, data: { sku: data.sku, name: data.name, pricePaise: data.pricePaise, initialStock } },
          { strict: true }
        );
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
  const { user } = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(storeProducts)
    .set({ archivedAt: new Date(), isFeatured: false, updatedAt: new Date() })
    .where(and(eq(storeProducts.id, parsed.data.productId), isNull(storeProducts.archivedAt)))
    .returning({ id: storeProducts.id, sku: storeProducts.sku });
  if (!row) return fail("Product not found or already archived");
  await writeStoreAudit(db, { actorUserId: user.id, action: "product.archive", entity: "product", entityId: row.id, data: { sku: row.sku } });
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${row.id}`);
  return { ok: true };
}

/** Brings an archived product back (inactive, so it can be checked before going live). */
export async function restoreStoreProduct(input: unknown): Promise<StoreActionResult> {
  const parsed = storeProductIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid product");
  const { user } = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(storeProducts)
    .set({ archivedAt: null, isActive: false, updatedAt: new Date() })
    .where(eq(storeProducts.id, parsed.data.productId))
    .returning({ id: storeProducts.id, sku: storeProducts.sku });
  if (!row) return fail("Product not found");
  await writeStoreAudit(db, { actorUserId: user.id, action: "product.restore", entity: "product", entityId: row.id, data: { sku: row.sku } });
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${row.id}`);
  return { ok: true };
}

/** Restock (+) or correct (±) a product's stock; logged as a stock movement. */
export async function adjustStock(input: unknown): Promise<StoreActionResult<{ stock: number }>> {
  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const r = await adjustStoreStock(db, { ...parsed.data, actor: user.id });
  if (!r.ok) return r;
  await writeStoreAudit(db, {
    actorUserId: user.id,
    action: "stock.adjust",
    entity: "product",
    entityId: parsed.data.productId,
    data: { delta: parsed.data.delta, reason: parsed.data.reason, stockAfter: r.stock, note: parsed.data.note ?? null },
  });
  revalidateCatalog();
  revalidatePath(`${ADMIN}/products/${parsed.data.productId}`);
  return { ok: true, stock: r.stock };
}

/** Creates or updates a category by its slug id. */
export async function saveStoreCategory(input: unknown): Promise<StoreActionResult<{ id: string }>> {
  const parsed = storeCategorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const { icon, ...rest } = parsed.data;
  const values = { ...rest, emojiIcon: icon, updatedAt: new Date() };
  await db
    .insert(storeCategories)
    .values(values)
    .onConflictDoUpdate({ target: storeCategories.id, set: { name: values.name, description: values.description, emojiIcon: icon, sort: values.sort, isActive: values.isActive, updatedAt: values.updatedAt } });
  await writeStoreAudit(db, { actorUserId: user.id, action: "category.save", entity: "category", entityId: parsed.data.id, data: { name: values.name, isActive: values.isActive } });
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
  const db = getDb();
  const r = await transitionStoreOrder(db, {
    orderId: d.orderId,
    to: d.to,
    actor: "admin",
    actorId: user.id,
    cancelReason: d.cancelReason,
    courier: d.courier,
    trackingNumber: d.trackingNumber,
  });
  if (!r.ok) return r;
  await writeStoreAudit(db, {
    actorUserId: user.id,
    action: "order.status",
    entity: "order",
    entityId: r.orderId,
    data: { from: r.from, to: r.to, paymentStatus: r.paymentStatus, restocked: r.restocked, cancelReason: d.cancelReason ?? null },
  });
  revalidateShopOrder(r.orderId);
  if (r.restocked) revalidateCatalog();
  return { ok: true, status: r.to };
}

/** Courier, tracking number and internal note, without changing status. */
export async function updateStoreOrderDetails(input: unknown): Promise<StoreActionResult> {
  const parsed = updateStoreOrderDetailsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const d = parsed.data;
  const [row] = await db
    .update(storeOrders)
    .set({ courier: d.courier || null, trackingNumber: d.trackingNumber || null, adminNote: d.adminNote || null, updatedAt: new Date() })
    .where(eq(storeOrders.id, d.orderId))
    .returning({ id: storeOrders.id });
  if (!row) return fail("Order not found");
  await writeStoreAudit(db, { actorUserId: user.id, action: "order.details", entity: "order", entityId: row.id, data: { courier: d.courier, trackingNumber: d.trackingNumber } });
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
  const r = await refundStoreOrderCore(db, { orderId: parsed.data.orderId, actorId: user.id, note: parsed.data.note });
  if (!r.ok) return r;
  await writeStoreAudit(db, {
    actorUserId: user.id,
    action: "order.refund",
    entity: "order",
    entityId: r.orderId,
    data: { refundId: r.refundId, amountPaise: r.amountPaise, note: parsed.data.note ?? null },
  });
  queueStoreEmail(r.orderId, "refunded");
  revalidateShopOrder(r.orderId);
  return { ok: true, refundId: r.refundId };
}

// ─── Admin: settings ─────────────────────────────────────────────────

export async function saveStoreSettings(input: unknown): Promise<StoreActionResult> {
  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const d = parsed.data;
  // Fields an older form does not send (estimate, return window, auto-forward) stay as saved.
  const values = { ...d, closedMessage: d.closedMessage || null, updatedBy: user.id, updatedAt: new Date() };
  await db.insert(storeSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: storeSettings.id, set: values });
  await writeStoreAudit(db, { actorUserId: user.id, action: "settings.save", entity: "settings", entityId: "1", data: { ...d } });
  revalidatePath(`${ADMIN}/settings`);
  revalidatePath(`${ADMIN}/shipping`);
  revalidatePath(ADMIN);
  revalidatePath(SHOP, "layout");
  return { ok: true };
}
