import "server-only";
import { after } from "next/server";
import { and, asc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  consumers,
  storeCategories,
  storeCouponRedemptions,
  storeCoupons,
  storeOrderCounters,
  storeOrderItems,
  storeOrders,
  storePayments,
  storeProducts,
  storeStockMovements,
} from "@/db/schema";
import type { Coordinates } from "@/core/geo";
import { formatINR } from "@/core/money";
import {
  cameBackInStock,
  canTransitionStoreOrder,
  checkStoreCoupon,
  etaLabel,
  formatShipAddress,
  formatStoreOrderNumber,
  isCodAllowed,
  isValidPincode,
  mergeBagLines,
  normalizeCouponCode,
  normalizeIndianMobile,
  normalizeIndianState,
  paymentStatusAfterCancel,
  resolveShippingZone,
  restocksOnTransition,
  storeCartTotals,
  storeOrderPeriod,
  storeServiceability,
  STORE_PAYMENT_HOLD_MINUTES,
  type CouponCheck,
  type StoreActor,
  type StoreCouponKind,
  type StoreOrderStatus,
  type StorePaymentMode,
  type StorePaymentStatus,
  type StoreStockReason,
} from "@/core/store";
import { renderEmailHtml, sendUserEmailIfAllowed } from "@/features/notifications/service";
import { APP_URL } from "@/lib/app-url";
import { refundRazorpayPayment } from "@/lib/razorpay";
import { queueAutoForward } from "./fulfilment";
import { isUniqueViolation, loadShippingZones, loadStoreSettings, StoreRuleError, toPublicSettings, type StoreConn, type StoreDb, type StoreTx } from "./settings";
import { queueBackInStock } from "./stock-alerts";

/**
 * The RUXs Store order engine: placement (atomic stock reservation, shipping
 * zone and coupon checks), status moves (restock on cancel/return), Razorpay
 * settle/fail/refund and stock adjustments. Every function takes the database
 * as an argument so integration tests can pass a script client; actions pass
 * getDb(). No auth here: callers guard.
 */

export { loadStoreSettings, toPublicSettings };
export type { StoreDb };

// ─── Coupons ─────────────────────────────────────────────────────────

type CouponRow = typeof storeCoupons.$inferSelect;

export type StoreCouponEvaluation = { coupon: CouponRow; check: CouponCheck } | null;

/**
 * Looks a code up (case-insensitive) and checks it against this bag and
 * household. Inside the placement transaction pass `lock` so two orders can't
 * both take the last use. Cancelled orders don't count towards the limits.
 */
export async function evaluateStoreCoupon(
  db: StoreConn,
  input: { code: string; userId: string | null; subtotalPaise: number; now: Date; lock?: boolean }
): Promise<StoreCouponEvaluation> {
  const code = normalizeCouponCode(input.code);
  if (!code) return null;
  const base = db.select().from(storeCoupons).where(sql`upper(${storeCoupons.code}) = ${code}`).limit(1);
  const [coupon] = input.lock ? await base.for("update") : await base;
  if (!coupon) return null;
  const [uses] = await db
    .select({
      total: sql<number>`count(*)::int`,
      mine: sql<number>`count(*) filter (where ${storeCouponRedemptions.userId} = ${input.userId ?? ""})::int`,
    })
    .from(storeCouponRedemptions)
    .innerJoin(storeOrders, eq(storeCouponRedemptions.orderId, storeOrders.id))
    .where(and(eq(storeCouponRedemptions.couponId, coupon.id), ne(storeOrders.status, "cancelled")));
  const check = checkStoreCoupon(
    {
      kind: coupon.kind as StoreCouponKind,
      value: coupon.value,
      minOrderPaise: coupon.minOrderPaise,
      maxDiscountPaise: coupon.maxDiscountPaise,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      isActive: coupon.isActive,
    },
    { subtotalPaise: input.subtotalPaise, now: input.now, totalUses: uses?.total ?? 0, userUses: uses?.mine ?? 0 }
  );
  return { coupon, check };
}

// ─── Placement ───────────────────────────────────────────────────────

export interface PlaceStoreOrderInput {
  userId: string;
  clientKey: string;
  items: { productId: string; qty: number }[];
  paymentMode: StorePaymentMode;
  notes?: string | null;
  /** Full ship-to address. PIN, state and phone are re-validated here. */
  shipping: { name: string; phone: string; line1: string; line2?: string | null; landmark?: string | null; city: string; state: string; pincode: string };
  /** Where order emails go (snapshot). */
  email?: string | null;
  couponCode?: string | null;
  /** The total the household saw; the order is refused when the server total differs. */
  expectedTotalPaise?: number;
  /** Only used in "geofence" mode: the household's saved location. */
  point?: Coordinates | null;
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
      discountPaise: number;
      /** false when this clientKey had already placed the order (double tap). */
      created: boolean;
    }
  | { ok: false; error: string };

async function existingByClientKey(db: StoreConn, userId: string, clientKey: string) {
  const [row] = await db
    .select({
      id: storeOrders.id,
      orderNumber: storeOrders.orderNumber,
      status: storeOrders.status,
      paymentMode: storeOrders.paymentMode,
      totalPaise: storeOrders.totalPaise,
      discountPaise: storeOrders.discountPaise,
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
        discountPaise: row.discountPaise,
        created: false,
      }
    : null;
}

/**
 * Places an order in one transaction: locks the products (FOR UPDATE, id
 * order), re-reads prices and stock, prices delivery by shipping zone, checks
 * the coupon under a row lock, decrements stock with a guarded UPDATE, then
 * writes the order, items, stock movements and coupon redemption.
 * Idempotent per (user, clientKey).
 * COD → placed. Online → awaiting_payment, stock held until paid or expired.
 * An order a coupon makes free is placed (and paid) at once.
 */
export async function placeStoreOrderTx(db: StoreDb, input: PlaceStoreOrderInput): Promise<PlaceStoreOrderResult> {
  const already = await existingByClientKey(db, input.userId, input.clientKey);
  if (already) return already;

  const lines = mergeBagLines(input.items);
  if (lines.length === 0) return { ok: false, error: "Your bag is empty" };

  const [settings, zones] = await Promise.all([loadStoreSettings(db), loadShippingZones(db)]);
  if (!settings.isOpen) return { ok: false, error: settings.closedMessage || "The RUXs Store is closed right now" };

  const ship = input.shipping;
  const state = normalizeIndianState(ship.state);
  const phone = normalizeIndianMobile(ship.phone);
  const name = ship.name.trim();
  const line1 = ship.line1.trim();
  const city = ship.city.trim();
  if (!name || !line1 || !city) return { ok: false, error: "Add your full delivery address" };
  if (!isValidPincode(ship.pincode)) return { ok: false, error: "Enter a valid 6-digit PIN code" };
  if (!state) return { ok: false, error: "Choose your state" };
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number" };
  const shipTo = { line1, line2: ship.line2?.trim() || null, landmark: ship.landmark?.trim() || null, city, state, pincode: ship.pincode };

  // "india" ships everywhere; "geofence" still needs the saved location inside the service area.
  const reach = storeServiceability(input.point ?? null, settings);
  if (!reach.ok) return { ok: false, error: reach.message };
  const shipping = resolveShippingZone({ pincode: shipTo.pincode, state }, zones, settings);
  const couponCode = input.couponCode ? normalizeCouponCode(input.couponCode) : "";

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

      const pricedLines = priced.map((l) => ({ unitPricePaise: l.product.pricePaise, qty: l.qty }));
      const fees = { deliveryFeePaise: shipping.feePaise, freeDeliveryAbovePaise: shipping.freeAbovePaise };
      const subtotalPaise = storeCartTotals(pricedLines, fees).subtotalPaise;
      if (subtotalPaise < settings.minOrderPaise) {
        throw new StoreRuleError(`Minimum order is ${formatINR(settings.minOrderPaise)}. Add a few more items.`);
      }

      // The coupon row stays locked until commit, so its limits can't be overshot by a concurrent order.
      let coupon: { id: string; code: string; discountPaise: number } | null = null;
      if (couponCode) {
        const evaluated = await evaluateStoreCoupon(tx, { code: couponCode, userId: input.userId, subtotalPaise, now, lock: true });
        if (!evaluated) throw new StoreRuleError("That code is not valid. Remove it or try another.");
        if (!evaluated.check.ok) throw new StoreRuleError(evaluated.check.message);
        coupon = { id: evaluated.coupon.id, code: evaluated.coupon.code, discountPaise: evaluated.check.discountPaise };
      }

      const totals = storeCartTotals(pricedLines, fees, coupon?.discountPaise ?? 0);
      if (input.expectedTotalPaise !== undefined && input.expectedTotalPaise !== totals.totalPaise) {
        throw new StoreRuleError("Prices or delivery charges changed. Review your bag and try again.");
      }
      // Razorpay takes nothing under ₹1: such an order would sit unpaid, holding stock, until it expired.
      if (input.paymentMode === "online" && totals.totalPaise > 0 && totals.totalPaise < 100) {
        throw new StoreRuleError("This total is too small to pay online. Choose pay on delivery or add an item.");
      }
      if (input.paymentMode === "cod" && totals.totalPaise > 0) {
        if (!shipping.codAllowed) throw new StoreRuleError("Pay on delivery is not available at this PIN code. Please pay online.");
        if (!isCodAllowed(totals.totalPaise, settings)) {
          throw new StoreRuleError(
            settings.codEnabled && settings.codMaxPaise != null
              ? `Cash on delivery is available up to ${formatINR(settings.codMaxPaise)}. Please pay online.`
              : "Cash on delivery is not available right now. Please pay online."
          );
        }
      }

      const period = storeOrderPeriod(now);
      // Row-locked upsert: concurrent orders queue here, so sequences never collide.
      const [counter] = await tx
        .insert(storeOrderCounters)
        .values({ period, lastSeq: 1 })
        .onConflictDoUpdate({ target: storeOrderCounters.period, set: { lastSeq: sql`${storeOrderCounters.lastSeq} + 1` } })
        .returning({ lastSeq: storeOrderCounters.lastSeq });
      const orderNumber = formatStoreOrderNumber(counter!.lastSeq, now);

      // Nothing to pay (a coupon covered it): no payment step, whatever mode was picked.
      const free = totals.totalPaise === 0;
      const status: StoreOrderStatus = input.paymentMode === "online" && !free ? "awaiting_payment" : "placed";
      const [order] = await tx
        .insert(storeOrders)
        .values({
          orderNumber,
          userId: input.userId,
          clientKey: input.clientKey,
          status,
          paymentMode: input.paymentMode,
          paymentStatus: free ? "paid" : "unpaid",
          subtotalPaise: totals.subtotalPaise,
          deliveryFeePaise: totals.deliveryFeePaise,
          discountPaise: totals.discountPaise,
          totalPaise: totals.totalPaise,
          couponId: coupon?.id ?? null,
          couponCode: coupon?.code ?? null,
          customerName: name,
          customerEmail: input.email?.trim() || null,
          phone,
          address: formatShipAddress(shipTo),
          shipLine1: shipTo.line1,
          shipLine2: shipTo.line2,
          shipLandmark: shipTo.landmark,
          shipCity: shipTo.city,
          shipState: shipTo.state,
          shipPincode: shipTo.pincode,
          zoneId: shipping.zoneId,
          zoneName: shipping.zoneName,
          etaMinDays: shipping.etaMinDays,
          etaMaxDays: shipping.etaMaxDays,
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

      if (coupon) {
        await tx.insert(storeCouponRedemptions).values({
          couponId: coupon.id,
          orderId,
          userId: input.userId,
          discountPaise: totals.discountPaise,
          createdAt: now,
        });
      }

      return { orderId, orderNumber, status, totalPaise: totals.totalPaise, discountPaise: totals.discountPaise };
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
  /** Only for `returned`: put the units back on the shelf as 'return' movements (default: no). */
  restockReturn?: boolean;
  now?: Date;
}

export type TransitionStoreOrderResult =
  | {
      ok: true;
      orderId: string;
      from: StoreOrderStatus;
      to: StoreOrderStatus;
      paymentStatus: StorePaymentStatus;
      restocked: boolean;
      /** Products this move took from zero stock to some (back-in-stock alerts go out for them). */
      backInStock: string[];
    }
  | { ok: false; error: string; /** A business rule refused the move (not a system fault). */ rule?: true };

/** Puts an order's units back with one movement row each. Returns the products that came back from zero. */
async function restockOrderItems(tx: StoreTx, orderId: string, reason: Extract<StoreStockReason, "cancel" | "return">, actorId: string, now: Date): Promise<string[]> {
  const items = await tx
    .select({ productId: storeOrderItems.productId, qty: storeOrderItems.qty })
    .from(storeOrderItems)
    .where(eq(storeOrderItems.orderId, orderId))
    .orderBy(asc(storeOrderItems.productId));
  const back: string[] = [];
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
      reason,
      orderId,
      actor: actorId,
      createdAt: now,
    });
    if (cameBackInStock(row!.stock, item.qty)) back.push(item.productId);
  }
  return back;
}

/**
 * The status move itself, inside a caller's transaction (the return flow moves
 * the order and the return request together). Throws StoreRuleError on a refusal.
 */
export async function moveStoreOrderInTx(tx: StoreTx, input: TransitionStoreOrderInput): Promise<Extract<TransitionStoreOrderResult, { ok: true }>> {
  const now = input.now ?? new Date();
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
  // A free order (fully covered by a coupon) has no money to give back.
  if (paymentStatus === "refund_due" && order.totalPaise === 0) paymentStatus = "paid";
  patch.paymentStatus = paymentStatus;
  await tx.update(storeOrders).set(patch).where(eq(storeOrders.id, order.id));

  const restocked = restocksOnTransition(input.to) || (input.to === "returned" && input.restockReturn === true);
  const backInStock = restocked ? await restockOrderItems(tx, order.id, input.to === "returned" ? "return" : "cancel", input.actorId, now) : [];
  return { ok: true, orderId: order.id, from, to: input.to, paymentStatus, restocked, backInStock };
}

/** Moves an order under a row lock; cancelling puts the units back and logs each one. */
export async function transitionStoreOrder(db: StoreDb, input: TransitionStoreOrderInput): Promise<TransitionStoreOrderResult> {
  try {
    const result = await db.transaction((tx) => moveStoreOrderInTx(tx, input));
    if (input.to === "out_for_delivery" || input.to === "delivered" || (input.to === "cancelled" && input.actor !== "customer")) {
      queueStoreEmail(result.orderId, input.to);
    }
    queueBackInStock(result.backInStock);
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

  if (placedNow) {
    queueStoreEmail(payment.orderId, "placed");
    queueAutoForward(payment.orderId);
  }
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

export type RefundStoreOrderResult = { ok: true; orderId: string; refundId: string | null; amountPaise: number } | { ok: false; error: string };

/**
 * Refunds a cancelled or returned order. Online: every captured payment goes
 * back in full through Razorpay. COD: records that the cash was returned by hand.
 * The order is claimed as refunded first so a double click can't refund twice;
 * only a failed Razorpay call puts the claim back.
 */
export async function refundStoreOrderCore(
  db: StoreDb,
  input: { orderId: string; actorId: string; note?: string | null }
): Promise<RefundStoreOrderResult> {
  const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, input.orderId)).limit(1);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "cancelled" && order.status !== "returned") return { ok: false, error: "Cancel the order or mark it returned first" };
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "refund_due") return { ok: false, error: "Nothing to refund on this order" };

  const previous = order.paymentStatus;
  const [claimed] = await db
    .update(storeOrders)
    .set({ paymentStatus: "refunded", updatedAt: new Date() })
    .where(and(eq(storeOrders.id, order.id), inArray(storeOrders.paymentStatus, ["paid", "refund_due"])))
    .returning({ id: storeOrders.id });
  if (!claimed) return { ok: false, error: "This order was already refunded" };
  const unclaim = () =>
    db
      .update(storeOrders)
      .set({ paymentStatus: previous, updatedAt: new Date() })
      .where(and(eq(storeOrders.id, order.id), eq(storeOrders.paymentStatus, "refunded")));

  let refundId: string | null = null;
  let amountPaise = order.totalPaise;
  if (order.paymentMode === "online" && order.totalPaise > 0) {
    // Every captured payment goes back, not just one: a household that paid twice
    // (two checkouts open) must not be left with the second payment kept.
    const captured = await db
      .select()
      .from(storePayments)
      .where(and(eq(storePayments.orderId, order.id), eq(storePayments.status, "paid")));
    const pending = captured.filter((p) => p.razorpayPaymentId && !p.refundId);
    const alreadyRefunded = captured.filter((p) => p.refundId);
    if (pending.length === 0 && alreadyRefunded.length === 0) {
      // Nothing captured to refund through Razorpay: undo the claim instead of marking it refunded.
      await unclaim();
      return { ok: false, error: "No captured online payment found for this order" };
    }
    const note = input.note || `RUXs Store ${order.orderNumber} refund by ${input.actorId}`;
    const refundIds: string[] = alreadyRefunded.map((p) => p.refundId!);
    amountPaise = alreadyRefunded.reduce((n, p) => n + p.amountPaise, 0);
    for (const payment of pending) {
      let refund: { id: string };
      try {
        refund = await refundRazorpayPayment(payment.razorpayPaymentId!, payment.amountPaise, note);
      } catch (err) {
        // Payments refunded so far keep their refund id, so a retry only sends the rest.
        await unclaim();
        return { ok: false, error: err instanceof Error ? err.message : "Razorpay refund failed" };
      }
      refundIds.push(refund.id);
      amountPaise += payment.amountPaise;
      // The money has left: a failed write here must never release the claim (that would allow a second refund).
      try {
        await db.update(storePayments).set({ refundId: refund.id, refundedAt: new Date() }).where(eq(storePayments.id, payment.id));
      } catch (err) {
        console.error("[store] refund sent but not recorded", { orderId: order.id, paymentId: payment.id, refundId: refund.id, error: err instanceof Error ? err.message : err });
      }
    }
    refundId = refundIds.join(", ") || null;
  }
  if (input.note) {
    await db
      .update(storeOrders)
      .set({ adminNote: [order.adminNote, `Refund: ${input.note}`].filter(Boolean).join("\n"), updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
  }
  return { ok: true, orderId: order.id, refundId, amountPaise };
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
    // Households waiting on this product hear about it once.
    if (cameBackInStock(stock, input.delta)) queueBackInStock([input.productId]);
    return { ok: true, stock };
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message };
    console.error("[store] stock adjust failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not update stock. Please try again." };
  }
}

// ─── Email ───────────────────────────────────────────────────────────

type StoreEmailEvent = "placed" | "out_for_delivery" | "delivered" | "cancelled" | "return_approved" | "return_rejected" | "refunded";

// Household copy. Never name a courier partner or agency here: orders are "shipped by RUXs".
const EMAIL_COPY: Record<StoreEmailEvent, { subject: (n: string) => string; heading: string; lead: string }> = {
  placed: { subject: (n) => `RUXs Store order ${n} placed`, heading: "Your order is placed", lead: "We'll pack it and let you know when it's on the way." },
  out_for_delivery: { subject: (n) => `RUXs Store order ${n} is on the way`, heading: "Your order is on the way", lead: "Your RUXs Store order has been shipped by RUXs." },
  delivered: { subject: (n) => `RUXs Store order ${n} delivered`, heading: "Delivered", lead: "Your RUXs Store order was delivered. Enjoy!" },
  cancelled: { subject: (n) => `RUXs Store order ${n} cancelled`, heading: "Your order was cancelled", lead: "Your RUXs Store order was cancelled. Any online payment will be refunded." },
  return_approved: { subject: (n) => `Return approved for RUXs Store order ${n}`, heading: "Your return is approved", lead: "Keep the items packed with everything that came in the box. We'll arrange the pickup." },
  return_rejected: { subject: (n) => `Return update for RUXs Store order ${n}`, heading: "We couldn't accept this return", lead: "Your return request for this RUXs Store order was declined. Open the order to see why." },
  refunded: { subject: (n) => `Refund for RUXs Store order ${n}`, heading: "Your refund is on its way", lead: "We've refunded your RUXs Store order. Online refunds reach your account in 5 to 7 working days." },
};

async function sendStoreEmail(orderId: string, event: StoreEmailEvent) {
  const db = getDb();
  const [row] = await db
    .select({ order: storeOrders, email: consumers.email })
    .from(storeOrders)
    .leftJoin(consumers, eq(consumers.userId, storeOrders.userId))
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  const to = row?.order.customerEmail ?? row?.email;
  if (!row || !to) return;
  const copy = EMAIL_COPY[event];
  const url = `${APP_URL}/app/kids/shop/orders/${orderId}`;
  const details = [
    { label: "Order", value: row.order.orderNumber },
    { label: "Total", value: formatINR(row.order.totalPaise) },
    { label: "Payment", value: row.order.paymentMode === "cod" ? "Cash on delivery" : "Paid online" },
  ];
  if (event === "placed" && row.order.shipCity && row.order.shipPincode) {
    details.push({ label: "Deliver to", value: `${row.order.shipCity} ${row.order.shipPincode}` });
  }
  if (event === "placed" && row.order.etaMinDays != null && row.order.etaMaxDays != null) {
    details.push({ label: "Delivery after dispatch", value: etaLabel(row.order.etaMinDays, row.order.etaMaxDays) });
  }
  // Tracking number only. The courier/partner name stays internal: households see "Shipped by RUXs".
  if (event === "out_for_delivery" && row.order.trackingNumber) details.push({ label: "Tracking", value: row.order.trackingNumber });
  await sendUserEmailIfAllowed({
    userId: row.order.userId,
    to,
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
