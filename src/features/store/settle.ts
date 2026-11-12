import "server-only";
import { after } from "next/server";
import { and, asc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  consumers,
  storeCategories,
  storeOrderCounters,
  storeOrderItems,
  storeOrders,
  storePayments,
  storeProducts,
  storeSettings,
  storeStockMovements,
} from "@/db/schema";
import type { Coordinates } from "@/core/geo";
import { formatINR } from "@/core/money";
import {
  canTransitionStoreOrder,
  formatStoreOrderNumber,
  isCodAllowed,
  mergeBagLines,
  paymentStatusAfterCancel,
  restocksOnTransition,
  storeCartTotals,
  storeOrderPeriod,
  storeServiceability,
  STORE_PAYMENT_HOLD_MINUTES,
  type StoreActor,
  type StoreOrderStatus,
  type StorePaymentMode,
  type StorePaymentStatus,
  type StoreStockReason,
} from "@/core/store";
import { renderEmailHtml, sendUserEmailIfAllowed } from "@/features/notifications/service";
import { APP_URL } from "@/lib/app-url";
import type { PublicStoreSettings, StoreSettings } from "./types";

/**
 * The RUXs Store order engine: placement (atomic stock reservation), status
 * moves (restock on cancel), Razorpay settle/fail and stock adjustments.
 * Every function takes the database as an argument so integration tests can
 * pass a script client; actions pass getDb(). No auth here: callers guard.
 */

export type StoreDb = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<StoreDb["transaction"]>[0]>[0];
type Conn = StoreDb | Tx;

/** A rule broke inside a transaction: rolls it back and becomes a user-facing error. */
class StoreRuleError extends Error {}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

const DEFAULT_SETTINGS: StoreSettings = {
  isOpen: true,
  closedMessage: null,
  codEnabled: true,
  codMaxPaise: 300000,
  deliveryFeePaise: 4000,
  freeDeliveryAbovePaise: 49900,
  minOrderPaise: 0,
  serviceability: "geofence",
  serviceCity: "Ranchi",
  serviceLatitude: 23.3441,
  serviceLongitude: 85.3096,
  serviceRadiusKm: 25,
  dispatchDays: 1,
  updatedBy: null,
  updatedAt: null,
};

/** The single settings row, or safe defaults when the row is missing. */
export async function loadStoreSettings(db: Conn): Promise<StoreSettings> {
  const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (!row) return DEFAULT_SETTINGS;
  return {
    isOpen: row.isOpen,
    closedMessage: row.closedMessage,
    codEnabled: row.codEnabled,
    codMaxPaise: row.codMaxPaise,
    deliveryFeePaise: row.deliveryFeePaise,
    freeDeliveryAbovePaise: row.freeDeliveryAbovePaise,
    minOrderPaise: row.minOrderPaise,
    serviceability: row.serviceability === "india" ? "india" : "geofence",
    serviceCity: row.serviceCity,
    serviceLatitude: row.serviceLatitude,
    serviceLongitude: row.serviceLongitude,
    serviceRadiusKm: row.serviceRadiusKm,
    dispatchDays: row.dispatchDays,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}

export function toPublicSettings(s: StoreSettings): PublicStoreSettings {
  return {
    isOpen: s.isOpen,
    closedMessage: s.closedMessage,
    codEnabled: s.codEnabled,
    codMaxPaise: s.codMaxPaise,
    deliveryFeePaise: s.deliveryFeePaise,
    freeDeliveryAbovePaise: s.freeDeliveryAbovePaise,
    minOrderPaise: s.minOrderPaise,
    serviceability: s.serviceability,
    serviceCity: s.serviceCity,
    dispatchDays: s.dispatchDays,
  };
}

// ─── Placement ───────────────────────────────────────────────────────

export interface PlaceStoreOrderInput {
  userId: string;
  clientKey: string;
  items: { productId: string; qty: number }[];
  paymentMode: StorePaymentMode;
  notes?: string | null;
  contact: { name: string; phone: string; address: string };
  /** Where the order goes; checked against the store geofence. */
  point: Coordinates | null;
  now?: Date;
}

export type PlaceStoreOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      status: StoreOrderStatus;
      paymentMode: StorePaymentMode;
      totalPaise: number;
      /** false when this clientKey had already placed the order (double tap). */
      created: boolean;
    }
  | { ok: false; error: string };

async function existingByClientKey(db: Conn, userId: string, clientKey: string) {
  const [row] = await db
    .select({
      id: storeOrders.id,
      orderNumber: storeOrders.orderNumber,
      status: storeOrders.status,
      paymentMode: storeOrders.paymentMode,
      totalPaise: storeOrders.totalPaise,
    })
    .from(storeOrders)
    .where(and(eq(storeOrders.userId, userId), eq(storeOrders.clientKey, clientKey)))
    .limit(1);
  return row
    ? {
        ok: true as const,
        orderId: row.id,
        orderNumber: row.orderNumber,
        status: row.status as StoreOrderStatus,
        paymentMode: row.paymentMode as StorePaymentMode,
        totalPaise: row.totalPaise,
        created: false,
      }
    : null;
}

/**
 * Places an order in one transaction: locks the products (FOR UPDATE, id
 * order), re-reads prices and stock, decrements stock with a guarded UPDATE,
 * writes the order, items and stock movements. Idempotent per (user, clientKey).
 * COD → placed. Online → awaiting_payment, stock held until paid or expired.
 */
export async function placeStoreOrderTx(db: StoreDb, input: PlaceStoreOrderInput): Promise<PlaceStoreOrderResult> {
  const already = await existingByClientKey(db, input.userId, input.clientKey);
  if (already) return already;

  const lines = mergeBagLines(input.items);
  if (lines.length === 0) return { ok: false, error: "Your bag is empty" };

  const settings = await loadStoreSettings(db);
  if (!settings.isOpen) return { ok: false, error: settings.closedMessage || "The RUXs Store is closed right now" };
  const reach = storeServiceability(input.point, settings);
  if (!reach.ok) return { ok: false, error: reach.message };

  const now = input.now ?? new Date();
  try {
    const placed = await db.transaction(async (tx) => {
      const ids = lines.map((l) => l.productId).sort();
      const rows = await tx
        .select()
        .from(storeProducts)
        .where(inArray(storeProducts.id, ids))
        .orderBy(asc(storeProducts.id))
        .for("update");
      const byId = new Map(rows.map((p) => [p.id, p]));
      const catIds = [...new Set(rows.map((p) => p.categoryId))];
      const liveCats = catIds.length
        ? await tx
            .select({ id: storeCategories.id })
            .from(storeCategories)
            .where(and(inArray(storeCategories.id, catIds), eq(storeCategories.isActive, true)))
        : [];
      const liveCatIds = new Set(liveCats.map((c) => c.id));

      const priced = lines.map((l) => {
        const p = byId.get(l.productId);
        if (!p || !p.isActive || p.archivedAt || !liveCatIds.has(p.categoryId)) throw new StoreRuleError("Some items are no longer available. Refresh your bag.");
        if (p.stock < l.qty) {
          throw new StoreRuleError(p.stock <= 0 ? `${p.name} just sold out` : `Only ${p.stock} of ${p.name} left. Update your bag.`);
        }
        return { product: p, qty: l.qty };
      });

      const totals = storeCartTotals(
        priced.map((l) => ({ unitPricePaise: l.product.pricePaise, qty: l.qty })),
        settings
      );
      if (totals.subtotalPaise < settings.minOrderPaise) {
        throw new StoreRuleError(`Minimum order is ${formatINR(settings.minOrderPaise)}. Add a few more items.`);
      }
      if (input.paymentMode === "cod" && !isCodAllowed(totals.totalPaise, settings)) {
        throw new StoreRuleError(
          settings.codEnabled && settings.codMaxPaise != null
            ? `Cash on delivery is available up to ${formatINR(settings.codMaxPaise)}. Please pay online.`
            : "Cash on delivery is not available right now. Please pay online."
        );
      }

      const period = storeOrderPeriod(now);
      // Row-locked upsert: concurrent orders queue here, so sequences never collide.
      const [counter] = await tx
        .insert(storeOrderCounters)
        .values({ period, lastSeq: 1 })
        .onConflictDoUpdate({ target: storeOrderCounters.period, set: { lastSeq: sql`${storeOrderCounters.lastSeq} + 1` } })
        .returning({ lastSeq: storeOrderCounters.lastSeq });
      const orderNumber = formatStoreOrderNumber(counter!.lastSeq, now);

      const status: StoreOrderStatus = input.paymentMode === "online" ? "awaiting_payment" : "placed";
      const [order] = await tx
        .insert(storeOrders)
        .values({
          orderNumber,
          userId: input.userId,
          clientKey: input.clientKey,
          status,
          paymentMode: input.paymentMode,
          paymentStatus: "unpaid",
          subtotalPaise: totals.subtotalPaise,
          deliveryFeePaise: totals.deliveryFeePaise,
          totalPaise: totals.totalPaise,
          customerName: input.contact.name,
          phone: input.contact.phone,
          address: input.contact.address,
          latitude: input.point?.latitude ?? null,
          longitude: input.point?.longitude ?? null,
          notes: input.notes || null,
          placedAt: status === "placed" ? now : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: storeOrders.id });
      const orderId = order!.id;

      await tx.insert(storeOrderItems).values(
        priced.map((l) => ({
          orderId,
          productId: l.product.id,
          name: l.product.name,
          image: l.product.images[0] ?? null,
          unitPricePaise: l.product.pricePaise,
          qty: l.qty,
          lineTotalPaise: l.product.pricePaise * l.qty,
        }))
      );

      for (const l of priced) {
        // Guarded decrement: belt and braces on top of the row lock.
        const [left] = await tx
          .update(storeProducts)
          .set({ stock: sql`${storeProducts.stock} - ${l.qty}`, updatedAt: now })
          .where(and(eq(storeProducts.id, l.product.id), sql`${storeProducts.stock} >= ${l.qty}`))
          .returning({ stock: storeProducts.stock });
        if (!left) throw new StoreRuleError(`${l.product.name} just sold out`);
        await tx.insert(storeStockMovements).values({
          productId: l.product.id,
          delta: -l.qty,
          stockAfter: left.stock,
          reason: "order",
          orderId,
          actor: input.userId,
          createdAt: now,
        });
      }

      return { orderId, orderNumber, status, totalPaise: totals.totalPaise };
    });
    return { ok: true, ...placed, paymentMode: input.paymentMode, created: true };
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message };
    if (isUniqueViolation(err)) {
      // Two taps raced past the first check: return the order the other one wrote.
      const raced = await existingByClientKey(db, input.userId, input.clientKey);
      if (raced) return raced;
    }
    console.error("[store] place order failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not place your order. Please try again." };
  }
}

// ─── Status moves ────────────────────────────────────────────────────

export interface TransitionStoreOrderInput {
  orderId: string;
  to: StoreOrderStatus;
  actor: StoreActor;
  actorId: string;
  /** Customer moves pass their user id: the order must be theirs. */
  userId?: string;
  cancelReason?: string;
  courier?: string;
  trackingNumber?: string;
  now?: Date;
}

export type TransitionStoreOrderResult =
  | { ok: true; orderId: string; from: StoreOrderStatus; to: StoreOrderStatus; paymentStatus: StorePaymentStatus; restocked: boolean }
  | { ok: false; error: string; /** A business rule refused the move (not a system fault). */ rule?: true };

/** Moves an order under a row lock; cancelling puts the units back and logs each one. */
export async function transitionStoreOrder(db: StoreDb, input: TransitionStoreOrderInput): Promise<TransitionStoreOrderResult> {
  const now = input.now ?? new Date();
  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(storeOrders)
        .where(input.userId ? and(eq(storeOrders.id, input.orderId), eq(storeOrders.userId, input.userId)) : eq(storeOrders.id, input.orderId))
        .limit(1)
        .for("update");
      if (!order) throw new StoreRuleError("Order not found");
      const from = order.status as StoreOrderStatus;
      if (!canTransitionStoreOrder(from, input.to, input.actor)) {
        throw new StoreRuleError(
          input.actor === "customer" && input.to === "cancelled"
            ? "This order is already being packed and can't be cancelled"
            : "This order can't move to that status"
        );
      }

      let paymentStatus = order.paymentStatus as StorePaymentStatus;
      const patch: Partial<typeof storeOrders.$inferInsert> = { status: input.to, updatedAt: now };
      if (input.courier !== undefined) patch.courier = input.courier || null;
      if (input.trackingNumber !== undefined) patch.trackingNumber = input.trackingNumber || null;
      switch (input.to) {
        case "placed":
          patch.placedAt = now;
          break;
        case "packed":
          patch.packedAt = now;
          break;
        case "out_for_delivery":
          patch.shippedAt = now;
          break;
        case "delivered":
          patch.deliveredAt = now;
          // Cash collected at the door.
          if (order.paymentMode === "cod" && paymentStatus === "unpaid") paymentStatus = "paid";
          break;
        case "cancelled":
          patch.cancelledAt = now;
          patch.cancelReason = input.cancelReason || (input.actor === "customer" ? "Cancelled by customer" : input.actor === "system" ? "Payment not completed in time" : "Cancelled by RUXs");
          paymentStatus = paymentStatusAfterCancel(paymentStatus);
          break;
        case "returned":
          patch.returnedAt = now;
          paymentStatus = paymentStatusAfterCancel(paymentStatus);
          break;
      }
      patch.paymentStatus = paymentStatus;
      await tx.update(storeOrders).set(patch).where(eq(storeOrders.id, order.id));

      const restocked = restocksOnTransition(input.to);
      if (restocked) {
        const items = await tx
          .select({ productId: storeOrderItems.productId, qty: storeOrderItems.qty })
          .from(storeOrderItems)
          .where(eq(storeOrderItems.orderId, order.id))
          .orderBy(asc(storeOrderItems.productId));
        for (const item of items) {
          const [row] = await tx
            .update(storeProducts)
            .set({ stock: sql`${storeProducts.stock} + ${item.qty}`, updatedAt: now })
            .where(eq(storeProducts.id, item.productId))
            .returning({ stock: storeProducts.stock });
          await tx.insert(storeStockMovements).values({
            productId: item.productId,
            delta: item.qty,
            stockAfter: row!.stock,
            reason: "cancel",
            orderId: order.id,
            actor: input.actorId,
            createdAt: now,
          });
        }
      }
      return { ok: true as const, orderId: order.id, from, to: input.to, paymentStatus, restocked };
    });
    if (input.to === "out_for_delivery" || input.to === "delivered" || (input.to === "cancelled" && input.actor !== "customer")) {
      queueStoreEmail(result.orderId, input.to);
    }
    return result;
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message, rule: true };
    console.error("[store] status move failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not update the order. Please try again." };
  }
}

/** Releases the stock of unpaid online orders whose payment hold ran out. Safe to run every tick. */
export async function releaseExpiredStoreOrders(
  db: StoreDb,
  now: Date = new Date()
): Promise<{ released: number; failures: string[] }> {
  const cutoff = new Date(now.getTime() - STORE_PAYMENT_HOLD_MINUTES * 60_000);
  const stale = await db
    .select({ id: storeOrders.id })
    .from(storeOrders)
    .where(and(eq(storeOrders.status, "awaiting_payment"), lt(storeOrders.createdAt, cutoff)))
    .limit(200);
  let released = 0;
  const failures: string[] = [];
  for (const o of stale) {
    const r = await transitionStoreOrder(db, { orderId: o.id, to: "cancelled", actor: "system", actorId: "system", now });
    if (r.ok) released++;
    // A rule refusal means the order moved on meanwhile (paid or cancelled): nothing to release.
    else if (!r.rule) failures.push(`store-expire:${o.id}`);
  }
  return { released, failures };
}

// ─── Payments ────────────────────────────────────────────────────────

/** True when this Razorpay order belongs to the RUXs Store (webhook routing). */
export async function isStoreRazorpayOrder(razorpayOrderId: string, db: StoreDb = getDb()): Promise<boolean> {
  const [row] = await db
    .select({ id: storePayments.id })
    .from(storePayments)
    .where(eq(storePayments.razorpayOrderId, razorpayOrderId))
    .limit(1);
  return !!row;
}

export type SettleStorePaymentResult =
  | { handled: false }
  | { handled: true; ok: boolean; orderId: string; firstSettle: boolean };

/**
 * Records a captured payment exactly once (browser callback and webhook both
 * call this). awaiting_payment → placed. A payment landing after the order
 * was cancelled (hold expired, customer cancelled) is kept as refund_due.
 */
export async function settleStorePayment(
  input: { razorpayOrderId: string; razorpayPaymentId: string; amountPaise?: number },
  db: StoreDb = getDb()
): Promise<SettleStorePaymentResult> {
  const [payment] = await db
    .select()
    .from(storePayments)
    .where(eq(storePayments.razorpayOrderId, input.razorpayOrderId))
    .limit(1);
  if (!payment) return { handled: false };
  if (input.amountPaise !== undefined && input.amountPaise !== payment.amountPaise) {
    console.error("[store] payment amount mismatch", { razorpayOrderId: input.razorpayOrderId });
    return { handled: true, ok: false, orderId: payment.orderId, firstSettle: false };
  }

  const now = new Date();
  let placedNow = false;
  const firstSettle = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(storePayments)
      .set({ status: "paid", razorpayPaymentId: input.razorpayPaymentId, paidAt: now, failureReason: null })
      .where(and(eq(storePayments.id, payment.id), ne(storePayments.status, "paid")))
      .returning({ id: storePayments.id });
    if (!updated) return false; // already settled

    const [order] = await tx.select().from(storeOrders).where(eq(storeOrders.id, payment.orderId)).limit(1).for("update");
    if (!order) return true;
    if (order.status === "awaiting_payment") {
      placedNow = true;
      await tx
        .update(storeOrders)
        .set({ status: "placed", placedAt: now, paymentStatus: "paid", updatedAt: now })
        .where(eq(storeOrders.id, order.id));
    } else if (order.status === "cancelled" || order.status === "returned") {
      await tx.update(storeOrders).set({ paymentStatus: "refund_due", updatedAt: now }).where(eq(storeOrders.id, order.id));
    } else if (order.paymentStatus === "paid") {
      // A second, separate payment for an order already paid: admin must refund it.
      console.warn("[store] duplicate payment captured", { orderId: order.id, razorpayOrderId: input.razorpayOrderId });
    } else {
      await tx.update(storeOrders).set({ paymentStatus: "paid", updatedAt: now }).where(eq(storeOrders.id, order.id));
    }
    return true;
  });

  if (placedNow) queueStoreEmail(payment.orderId, "placed");
  return { handled: true, ok: true, orderId: payment.orderId, firstSettle };
}

/**
 * Marks a Razorpay attempt failed. The order keeps its stock hold so the
 * household can retry; the cron tick releases it after the hold ends.
 */
export async function failStorePayment(
  razorpayOrderId: string,
  reason: string,
  db: StoreDb = getDb()
): Promise<{ handled: boolean }> {
  const [row] = await db
    .update(storePayments)
    .set({ status: "failed", failureReason: reason.slice(0, 300) })
    .where(and(eq(storePayments.razorpayOrderId, razorpayOrderId), eq(storePayments.status, "created")))
    .returning({ id: storePayments.id });
  if (row) return { handled: true };
  return { handled: await isStoreRazorpayOrder(razorpayOrderId, db) };
}

// ─── Stock ───────────────────────────────────────────────────────────

/** Adds or removes units with a movement row, never going below zero. */
export async function adjustStoreStock(
  db: StoreDb,
  input: { productId: string; delta: number; reason: StoreStockReason; actor: string; note?: string | null; now?: Date }
): Promise<{ ok: true; stock: number } | { ok: false; error: string }> {
  if (!Number.isInteger(input.delta) || input.delta === 0) return { ok: false, error: "Enter how many units to add or remove" };
  const now = input.now ?? new Date();
  try {
    const stock = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(storeProducts)
        .set({ stock: sql`${storeProducts.stock} + ${input.delta}`, updatedAt: now })
        .where(and(eq(storeProducts.id, input.productId), sql`${storeProducts.stock} + ${input.delta} >= 0`))
        .returning({ stock: storeProducts.stock });
      if (!row) {
        const [exists] = await tx.select({ stock: storeProducts.stock }).from(storeProducts).where(eq(storeProducts.id, input.productId)).limit(1);
        throw new StoreRuleError(exists ? `Only ${exists.stock} in stock to remove` : "Product not found");
      }
      await tx.insert(storeStockMovements).values({
        productId: input.productId,
        delta: input.delta,
        stockAfter: row.stock,
        reason: input.reason,
        actor: input.actor,
        note: input.note || null,
        createdAt: now,
      });
      return row.stock;
    });
    return { ok: true, stock };
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message };
    console.error("[store] stock adjust failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not update stock. Please try again." };
  }
}

// ─── Email ───────────────────────────────────────────────────────────

type StoreEmailEvent = "placed" | "out_for_delivery" | "delivered" | "cancelled";

const EMAIL_COPY: Record<StoreEmailEvent, { subject: (n: string) => string; heading: string; lead: string }> = {
  placed: { subject: (n) => `RUXs Store order ${n} placed`, heading: "Your order is placed", lead: "We'll pack it and let you know when it's on the way." },
  out_for_delivery: { subject: (n) => `RUXs Store order ${n} is on the way`, heading: "Your order is on the way", lead: "Your RUXs Store order is out for delivery." },
  delivered: { subject: (n) => `RUXs Store order ${n} delivered`, heading: "Delivered", lead: "Your RUXs Store order was delivered. Enjoy!" },
  cancelled: { subject: (n) => `RUXs Store order ${n} cancelled`, heading: "Your order was cancelled", lead: "Your RUXs Store order was cancelled. Any online payment will be refunded." },
};

async function sendStoreEmail(orderId: string, event: StoreEmailEvent) {
  const db = getDb();
  const [row] = await db
    .select({ order: storeOrders, email: consumers.email })
    .from(storeOrders)
    .leftJoin(consumers, eq(consumers.userId, storeOrders.userId))
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  if (!row?.email) return;
  const copy = EMAIL_COPY[event];
  const url = `${APP_URL}/app/kids/shop/orders/${orderId}`;
  const details = [
    { label: "Order", value: row.order.orderNumber },
    { label: "Total", value: formatINR(row.order.totalPaise) },
    { label: "Payment", value: row.order.paymentMode === "cod" ? "Cash on delivery" : "Paid online" },
  ];
  if (event === "out_for_delivery" && row.order.courier) details.push({ label: "Courier", value: row.order.courier });
  if (event === "out_for_delivery" && row.order.trackingNumber) details.push({ label: "Tracking", value: row.order.trackingNumber });
  await sendUserEmailIfAllowed({
    userId: row.order.userId,
    to: row.email,
    category: "orders",
    subject: copy.subject(row.order.orderNumber),
    // renderEmailHtml escapes every value.
    html: renderEmailHtml({ heading: copy.heading, lead: copy.lead, details, actionText: "View order", actionUrl: url }),
    text: `${copy.lead}\n\nOrder ${row.order.orderNumber}: ${url}`,
  });
}

/** Sends after the response. Never throws; outside a request (tests, scripts) it is skipped. */
export function queueStoreEmail(orderId: string, event: StoreEmailEvent) {
  try {
    after(async () => {
      try {
        await sendStoreEmail(orderId, event);
      } catch (err) {
        console.error("[store] email failed", event, err instanceof Error ? err.message : err);
      }
    });
  } catch {
    // after() needs a request scope.
  }
}
