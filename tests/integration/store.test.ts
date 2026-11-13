import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { and, eq, sql } from "drizzle-orm";
import { scriptDb, scriptPool } from "@/db/script-client";
import {
  storeAuditLog,
  storeCategories,
  storeCouponRedemptions,
  storeCoupons,
  storeFulfilmentPartners,
  storeOrders,
  storePayments,
  storeProductReviews,
  storeProducts,
  storeReturnRequests,
  storeSettings,
  storeShippingZones,
  storeStockAlerts,
  storeStockMovements,
} from "@/db/schema";
import { bulkUpdateStockCore, importStoreProductsCore } from "@/features/store/catalog-import";
import { setStockAlertCore, setWishlistCore, submitStoreReviewCore } from "@/features/store/engagement";
import { autoForwardStoreOrder, forwardStoreOrderCore, suggestPartners } from "@/features/store/fulfilment";
import { moveStoreReturn, refundStoreReturn, requestStoreReturnCore } from "@/features/store/returns";
import {
  adjustStoreStock,
  evaluateStoreCoupon,
  placeStoreOrderTx,
  releaseExpiredStoreOrders,
  settleStorePayment,
  transitionStoreOrder,
  type PlaceStoreOrderInput,
  type StoreDb,
} from "@/features/store/settle";
import { sendBackInStockAlerts } from "@/features/store/stock-alerts";

/**
 * RUXs Store order engine against a disposable database (TEST_DATABASE_URL).
 * Needs migrations 0024 and 0025 applied. Skips when the database is unreachable.
 * The tests change the single store_settings row and put it back at the end.
 */
describe("RUXs Store integration", () => {
  let dbAvailable = false;
  const db = scriptDb as unknown as StoreDb;
  const ts = Date.now();
  const categoryId = `test-store-cat-${ts}`;
  const userA = `store-user-a-${ts}`;
  const userB = `store-user-b-${ts}`;
  const ranchi = { latitude: 23.36, longitude: 85.33 };
  /** A PIN code no other run or zone uses, so zone and partner matches are ours alone. */
  const pin = `7${String(ts).slice(-5)}`;
  const shipping = { name: "Test Parent", phone: "98765 43210", line1: "Flat 1, Test Society", city: "Mumbai", state: "maharashtra", pincode: "400001" };
  const shipTest = { ...shipping, city: "Testpur", state: "Tripura", pincode: pin };
  let productId: string;
  let lastOneId: string;
  let savedSettings: typeof storeSettings.$inferSelect | undefined;
  const orderIds: string[] = [];
  const zoneIds: string[] = [];
  const partnerIds: string[] = [];
  const couponIds: string[] = [];

  const order = (over: Partial<PlaceStoreOrderInput> = {}): PlaceStoreOrderInput => ({
    userId: userA,
    clientKey: crypto.randomUUID(),
    items: [{ productId, qty: 1 }],
    paymentMode: "cod",
    shipping,
    ...over,
  });
  const stockOf = async (id: string) => (await scriptDb.select({ stock: storeProducts.stock }).from(storeProducts).where(eq(storeProducts.id, id)))[0]!.stock;
  const orderRow = async (id: string) => (await scriptDb.select().from(storeOrders).where(eq(storeOrders.id, id)))[0]!;
  const setSettings = (patch: Partial<typeof storeSettings.$inferInsert>) => scriptDb.update(storeSettings).set(patch).where(eq(storeSettings.id, 1));
  /** placed → packed → out for delivery → delivered, as an admin. */
  const deliver = async (orderId: string, now?: Date) => {
    for (const to of ["packed", "out_for_delivery", "delivered"] as const) {
      const r = await transitionStoreOrder(db, { orderId, to, actor: "admin", actorId: "admin-test", now });
      if (!r.ok) throw new Error(r.error);
    }
  };

  beforeAll(async () => {
    scriptPool.on("error", () => {});
    try {
      const client = await scriptPool.connect();
      try {
        await client.query("select 1 from store_audit_log limit 1");
        dbAvailable = true;
      } finally {
        client.release();
      }
    } catch {
      console.warn("Test database unreachable or migrations 0024/0025 missing; skipping RUXs Store integration tests.");
      return;
    }
    await scriptDb.insert(storeSettings).values({ id: 1 }).onConflictDoNothing();
    [savedSettings] = await scriptDb.select().from(storeSettings).where(eq(storeSettings.id, 1));
    await setSettings({ isOpen: true, serviceability: "india", codEnabled: true, codMaxPaise: 300000, deliveryFeePaise: 4000, freeDeliveryAbovePaise: 49900, minOrderPaise: 0, returnWindowDays: 7, autoForward: false });
  });

  afterAll(async () => {
    // Stock movements, redemptions and the audit log are insert-only (triggers), so test
    // products and orders stay in the disposable database. Switch off what would affect other runs.
    if (!dbAvailable) return;
    if (savedSettings) {
      const { id: _id, ...rest } = savedSettings;
      void _id;
      await setSettings(rest);
    }
    for (const id of zoneIds) await scriptDb.update(storeShippingZones).set({ isActive: false }).where(eq(storeShippingZones.id, id));
    for (const id of partnerIds) await scriptDb.update(storeFulfilmentPartners).set({ isActive: false }).where(eq(storeFulfilmentPartners.id, id));
    for (const id of couponIds) await scriptDb.update(storeCoupons).set({ isActive: false }).where(eq(storeCoupons.id, id));
    // The pool is shared by every integration file; Bun closes it on exit.
  });

  it("sets up a category and products", async () => {
    if (!dbAvailable) return;
    await scriptDb.insert(storeCategories).values({ id: categoryId, name: "Test aisle" });
    const [p] = await scriptDb
      .insert(storeProducts)
      .values({ slug: `test-kit-${ts}`, sku: `T-KIT-${ts}`, categoryId, name: "Test kit", pricePaise: 30000, stock: 40 })
      .returning({ id: storeProducts.id });
    const [last] = await scriptDb
      .insert(storeProducts)
      .values({ slug: `test-last-${ts}`, sku: `T-LAST-${ts}`, categoryId, name: "Last one", pricePaise: 60000, stock: 1 })
      .returning({ id: storeProducts.id });
    productId = p!.id;
    lastOneId = last!.id;
  });

  // ─── Pan-India placement ───────────────────────────────────────────

  it("places a COD order anywhere in India, snapshots the address and is idempotent", async () => {
    if (!dbAvailable) return;
    const input = order({ items: [{ productId, qty: 2 }], email: "parent@example.com" });
    const first = await placeStoreOrderTx(db, input);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    orderIds.push(first.orderId);
    expect(first.status).toBe("placed");
    expect(first.orderNumber).toMatch(/^RS-\d{4}-\d{4,}$/);

    const again = await placeStoreOrderTx(db, input);
    expect(again).toMatchObject({ ok: true, orderId: first.orderId, created: false });

    expect(await stockOf(productId)).toBe(38);
    const moves = await scriptDb.select().from(storeStockMovements).where(eq(storeStockMovements.orderId, first.orderId));
    expect(moves.map((m) => m.delta)).toEqual([-2]);

    const o = await orderRow(first.orderId);
    expect(o).toMatchObject({
      customerName: "Test Parent",
      customerEmail: "parent@example.com",
      phone: "+919876543210",
      shipLine1: "Flat 1, Test Society",
      shipCity: "Mumbai",
      shipState: "Maharashtra",
      shipPincode: "400001",
      address: "Flat 1, Test Society, Mumbai, Maharashtra 400001",
      latitude: null,
      subtotalPaise: 60000,
      deliveryFeePaise: 0,
      discountPaise: 0,
      totalPaise: 60000,
      partnerId: null,
    });
    expect(o.etaMinDays).not.toBeNull();
  });

  it("refuses a bad PIN code, state, phone or address", async () => {
    if (!dbAvailable) return;
    for (const bad of [
      { ...shipping, pincode: "040001" },
      { ...shipping, pincode: "4000" },
      { ...shipping, state: "Narnia" },
      { ...shipping, phone: "12345" },
      { ...shipping, line1: "  " },
      { ...shipping, city: "" },
    ]) {
      const r = await placeStoreOrderTx(db, order({ shipping: bad }));
      expect(r.ok).toBe(false);
    }
    expect(await stockOf(productId)).toBe(38);
  });

  it("the database refuses a malformed PIN code or a total that ignores the discount", async () => {
    if (!dbAvailable) return;
    const id = orderIds[0]!;
    for (const bad of [
      sql`update store_orders set ship_pincode = '04000A' where id = ${id}`,
      sql`update store_orders set discount_paise = 1000 where id = ${id}`,
      sql`update store_orders set discount_paise = subtotal_paise + 1, total_paise = delivery_fee_paise - 1 where id = ${id}`,
    ]) {
      let blocked = false;
      try {
        await scriptDb.execute(bad);
      } catch {
        blocked = true;
      }
      expect(blocked).toBe(true);
    }
  });

  it("geofence mode still works: inside ships, outside or unknown location does not", async () => {
    if (!dbAvailable) return;
    await setSettings({ serviceability: "geofence", serviceLatitude: 23.3441, serviceLongitude: 85.3096, serviceRadiusKm: 25, serviceCity: "Ranchi" });
    try {
      const far = await placeStoreOrderTx(db, order({ point: { latitude: 22.8046, longitude: 86.2029 } }));
      expect(far.ok).toBe(false);
      const unknown = await placeStoreOrderTx(db, order());
      expect(unknown.ok).toBe(false);
      const near = await placeStoreOrderTx(db, order({ point: ranchi }));
      expect(near.ok).toBe(true);
      if (near.ok) orderIds.push(near.orderId);
    } finally {
      await setSettings({ serviceability: "india" });
    }
    const far = await placeStoreOrderTx(db, order({ point: { latitude: 22.8046, longitude: 86.2029 } }));
    expect(far.ok).toBe(true);
    if (far.ok) orderIds.push(far.orderId);
  });

  // ─── Shipping zones ────────────────────────────────────────────────

  it("prices delivery by the longest PIN prefix zone, with its estimate and COD rule", async () => {
    if (!dbAvailable) return;
    const zones = await scriptDb
      .insert(storeShippingZones)
      .values([
        { name: `Test wide ${ts}`, pinPrefixes: [pin.slice(0, 4)], feePaise: 7700, freeAbovePaise: null, etaMinDays: 4, etaMaxDays: 8, codAllowed: true },
        { name: `Test exact ${ts}`, pinPrefixes: [pin], feePaise: 9900, freeAbovePaise: 100000, etaMinDays: 5, etaMaxDays: 9, codAllowed: false },
      ])
      .returning({ id: storeShippingZones.id });
    zoneIds.push(...zones.map((z) => z.id));

    const cod = await placeStoreOrderTx(db, order({ shipping: shipTest }));
    expect(cod).toMatchObject({ ok: false });
    if (!cod.ok) expect(cod.error).toContain("Pay on delivery is not available at this PIN code");

    const online = await placeStoreOrderTx(db, order({ shipping: shipTest, paymentMode: "online" }));
    expect(online.ok).toBe(true);
    if (!online.ok) return;
    orderIds.push(online.orderId);
    expect(await orderRow(online.orderId)).toMatchObject({
      zoneId: zones[1]!.id,
      zoneName: `Test exact ${ts}`,
      deliveryFeePaise: 9900,
      etaMinDays: 5,
      etaMaxDays: 9,
      totalPaise: 39900,
      shipState: "Tripura",
    });
    // Release the hold so later stock checks are simple.
    await transitionStoreOrder(db, { orderId: online.orderId, to: "cancelled", actor: "customer", actorId: userA, userId: userA });

    // A neighbouring PIN falls back to the wider zone, where COD is fine.
    const neighbour = `${pin.slice(0, 4)}${pin[4] === "9" ? "0" : "9"}${pin[5]}`;
    const wide = await placeStoreOrderTx(db, order({ shipping: { ...shipTest, pincode: neighbour } }));
    expect(wide.ok).toBe(true);
    if (!wide.ok) return;
    orderIds.push(wide.orderId);
    expect(await orderRow(wide.orderId)).toMatchObject({ zoneName: `Test wide ${ts}`, deliveryFeePaise: 7700, totalPaise: 37700 });
    await transitionStoreOrder(db, { orderId: wide.orderId, to: "cancelled", actor: "customer", actorId: userA, userId: userA });
  });

  // ─── Coupons ───────────────────────────────────────────────────────

  it("applies a coupon inside the placement transaction and enforces its limits", async () => {
    if (!dbAvailable) return;
    const code = `T10${ts}`;
    const [c] = await scriptDb
      .insert(storeCoupons)
      .values({ code, kind: "percent", value: 1000, maxDiscountPaise: 2500, minOrderPaise: 20000, usageLimit: 1, perUserLimit: 1 })
      .returning({ id: storeCoupons.id });
    couponIds.push(c!.id);

    // Codes are unique whatever the case.
    let duplicate = false;
    try {
      await scriptDb.insert(storeCoupons).values({ code: code.toLowerCase(), kind: "flat", value: 100 });
    } catch {
      duplicate = true;
    }
    expect(duplicate).toBe(true);

    const preview = await evaluateStoreCoupon(db, { code: code.toLowerCase(), userId: userA, subtotalPaise: 30000, now: new Date() });
    expect(preview?.check).toEqual({ ok: true, discountPaise: 2500 });
    expect(await evaluateStoreCoupon(db, { code: "NO-SUCH-CODE", userId: userA, subtotalPaise: 30000, now: new Date() })).toBeNull();

    // The household was shown a different total: refuse instead of charging something else.
    const stale = await placeStoreOrderTx(db, order({ couponCode: code, expectedTotalPaise: 34000 }));
    expect(stale.ok).toBe(false);

    const unknown = await placeStoreOrderTx(db, order({ couponCode: "NO-SUCH-CODE" }));
    expect(unknown.ok).toBe(false);

    // 30000 + 4000 delivery - 2500 (10% capped) = 31500
    const first = await placeStoreOrderTx(db, order({ couponCode: ` ${code.toLowerCase()} `, expectedTotalPaise: 31500 }));
    expect(first).toMatchObject({ ok: true, totalPaise: 31500, discountPaise: 2500 });
    if (!first.ok) return;
    orderIds.push(first.orderId);
    expect(await orderRow(first.orderId)).toMatchObject({ couponId: c!.id, couponCode: code, discountPaise: 2500, subtotalPaise: 30000, deliveryFeePaise: 4000, totalPaise: 31500 });
    const redemptions = await scriptDb.select().from(storeCouponRedemptions).where(eq(storeCouponRedemptions.couponId, c!.id));
    expect(redemptions.map((r) => [r.orderId, r.userId, r.discountPaise])).toEqual([[first.orderId, userA, 2500]]);

    // Used up: nobody else gets it, and the stock is untouched by the refused order.
    const before = await stockOf(productId);
    const second = await placeStoreOrderTx(db, order({ userId: userB, couponCode: code }));
    expect(second.ok).toBe(false);
    expect(await stockOf(productId)).toBe(before);

    // Cancelling the order frees the use again; redemption rows are never deleted.
    await transitionStoreOrder(db, { orderId: first.orderId, to: "cancelled", actor: "customer", actorId: userA, userId: userA });
    const third = await placeStoreOrderTx(db, order({ userId: userB, couponCode: code }));
    expect(third.ok).toBe(true);
    if (third.ok) orderIds.push(third.orderId);

    let blocked = false;
    try {
      await scriptDb.execute(sql`delete from store_coupon_redemptions where coupon_id = ${c!.id}`);
    } catch {
      blocked = true;
    }
    expect(blocked).toBe(true);
  });

  it("two concurrent orders cannot both take a coupon's last use", async () => {
    if (!dbAvailable) return;
    const code = `TRACE${ts}`;
    const [c] = await scriptDb.insert(storeCoupons).values({ code, kind: "flat", value: 5000, usageLimit: 1 }).returning({ id: storeCoupons.id });
    couponIds.push(c!.id);
    const results = await Promise.all([placeStoreOrderTx(db, order({ userId: userA, couponCode: code })), placeStoreOrderTx(db, order({ userId: userB, couponCode: code }))]);
    expect(results.filter((r) => r.ok).length).toBe(1);
    for (const r of results) if (r.ok) orderIds.push(r.orderId);
    const used = await scriptDb.select().from(storeCouponRedemptions).where(eq(storeCouponRedemptions.couponId, c!.id));
    expect(used.length).toBe(1);
  });

  it("an order a coupon makes free is placed and paid without a payment step", async () => {
    if (!dbAvailable) return;
    const code = `TFREE${ts}`;
    const [c] = await scriptDb.insert(storeCoupons).values({ code, kind: "flat", value: 500000 }).returning({ id: storeCoupons.id });
    couponIds.push(c!.id);
    // 2 x 30000 = 60000 reaches free delivery; the flat coupon covers the rest.
    const r = await placeStoreOrderTx(db, order({ items: [{ productId, qty: 2 }], paymentMode: "online", couponCode: code }));
    expect(r).toMatchObject({ ok: true, status: "placed", totalPaise: 0, discountPaise: 60000 });
    if (!r.ok) return;
    orderIds.push(r.orderId);
    expect(await orderRow(r.orderId)).toMatchObject({ paymentStatus: "paid", placedAt: expect.any(Date) });
    // Cancelling it leaves nothing to refund.
    const cancelled = await transitionStoreOrder(db, { orderId: r.orderId, to: "cancelled", actor: "customer", actorId: userA, userId: userA });
    expect(cancelled).toMatchObject({ ok: true, paymentStatus: "paid" });
  });

  // ─── Stock, payment, cancel (v1 behaviour) ─────────────────────────

  it("sells the last unit to exactly one of two concurrent orders", async () => {
    if (!dbAvailable) return;
    const place = (userId: string) => placeStoreOrderTx(db, order({ userId, items: [{ productId: lastOneId, qty: 1 }] }));
    const results = await Promise.all([place(userA), place(userB)]);
    const wins = results.filter((r) => r.ok);
    expect(wins.length).toBe(1);
    for (const w of wins) if (w.ok) orderIds.push(w.orderId);
    expect(await stockOf(lastOneId)).toBe(0);
  });

  let paidOrderId = "";
  it("settles an online order once, even when called twice", async () => {
    if (!dbAvailable) return;
    const r = await placeStoreOrderTx(db, order({ userId: userB, paymentMode: "online" }));
    expect(r.ok && r.status).toBe("awaiting_payment");
    if (!r.ok) return;
    orderIds.push(r.orderId);
    paidOrderId = r.orderId;
    const razorpayOrderId = `order_test_${ts}`;
    await scriptDb.insert(storePayments).values({ orderId: r.orderId, userId: userB, razorpayOrderId, amountPaise: r.totalPaise });

    const wrong = await settleStorePayment({ razorpayOrderId, razorpayPaymentId: `pay_test_${ts}`, amountPaise: r.totalPaise + 1 }, db);
    expect(wrong).toMatchObject({ handled: true, ok: false });
    const s1 = await settleStorePayment({ razorpayOrderId, razorpayPaymentId: `pay_test_${ts}`, amountPaise: r.totalPaise }, db);
    const s2 = await settleStorePayment({ razorpayOrderId, razorpayPaymentId: `pay_test_${ts}`, amountPaise: r.totalPaise }, db);
    expect(s1).toMatchObject({ handled: true, ok: true, firstSettle: true });
    expect(s2).toMatchObject({ handled: true, ok: true, firstSettle: false });
    expect(await orderRow(r.orderId)).toMatchObject({ status: "placed", paymentStatus: "paid" });

    expect(await settleStorePayment({ razorpayOrderId: "order_unknown", razorpayPaymentId: "pay_x" }, db)).toEqual({ handled: false });
  });

  it("customer cancel restocks; paid cancel becomes refund_due", async () => {
    if (!dbAvailable) return;
    const before = await stockOf(productId);
    const r = await transitionStoreOrder(db, { orderId: paidOrderId, to: "cancelled", actor: "customer", actorId: userB, userId: userB });
    expect(r).toMatchObject({ ok: true, restocked: true, paymentStatus: "refund_due" });
    expect(await stockOf(productId)).toBe(before + 1);

    // Someone else's order cannot be cancelled.
    const other = await transitionStoreOrder(db, { orderId: orderIds[0]!, to: "cancelled", actor: "customer", actorId: userB, userId: userB });
    expect(other.ok).toBe(false);
  });

  it("releases expired unpaid holds", async () => {
    if (!dbAvailable) return;
    const r = await placeStoreOrderTx(db, order({ paymentMode: "online", now: new Date(Date.now() - 60 * 60_000) }));
    if (!r.ok) throw new Error(r.error);
    orderIds.push(r.orderId);
    const res = await releaseExpiredStoreOrders(db);
    expect(res.released).toBeGreaterThanOrEqual(1);
    expect((await orderRow(r.orderId)).status).toBe("cancelled");
  });

  it("adjusts stock without going negative and keeps movements insert-only", async () => {
    if (!dbAvailable) return;
    const up = await adjustStoreStock(db, { productId, delta: 10, reason: "restock", actor: "admin-test" });
    expect(up.ok).toBe(true);
    const tooMany = await adjustStoreStock(db, { productId, delta: -1000, reason: "adjust", actor: "admin-test" });
    expect(tooMany.ok).toBe(false);
    let blocked = false;
    try {
      await scriptDb.execute(sql`update store_stock_movements set delta = 99 where product_id = ${productId}`);
    } catch {
      blocked = true;
    }
    expect(blocked).toBe(true);
  });

  // ─── Fulfilment partners (internal) ────────────────────────────────

  it("suggests partners by coverage and forwards an order with an audit entry", async () => {
    if (!dbAvailable) return;
    const partners = await scriptDb
      .insert(storeFulfilmentPartners)
      .values([
        { name: `Test PIN partner ${ts}`, email: "pin@example.com", coveragePinPrefixes: [pin] },
        { name: `Test state partner ${ts}`, email: "state@example.com", coverageStates: ["Tripura"] },
        { name: `Test off partner ${ts}`, email: "off@example.com", coveragePinPrefixes: [pin], isActive: false },
      ])
      .returning({ id: storeFulfilmentPartners.id });
    partnerIds.push(...partners.map((p) => p.id));
    const [pinPartner, statePartner, offPartner] = partners.map((p) => p.id) as [string, string, string];

    const ranked = await suggestPartners(db, { pincode: pin, state: "Tripura" });
    expect(ranked[0]).toMatchObject({ partnerId: pinPartner, matchedBy: "pin" });
    expect(ranked.findIndex((s) => s.partnerId === statePartner)).toBeGreaterThan(0);
    expect(ranked.some((s) => s.partnerId === offPartner)).toBe(false);

    await scriptDb.update(storeShippingZones).set({ codAllowed: true }).where(eq(storeShippingZones.id, zoneIds[1]!));
    const placed = await placeStoreOrderTx(db, order({ shipping: shipTest }));
    if (!placed.ok) throw new Error(placed.error);
    orderIds.push(placed.orderId);

    const off = await forwardStoreOrderCore(db, { orderId: placed.orderId, partnerId: offPartner, actorId: "admin-test" });
    expect(off).toMatchObject({ ok: false, rule: true });

    const fwd = await forwardStoreOrderCore(db, { orderId: placed.orderId, partnerId: statePartner, actorId: "admin-test" });
    expect(fwd).toMatchObject({ ok: true, partnerId: statePartner, reassigned: false });
    await scriptDb.update(storeOrders).set({ partnerRef: "AWB-1", forwardEmailedAt: new Date() }).where(eq(storeOrders.id, placed.orderId));

    // Reassigning starts the new partner with a clean slate.
    const again = await forwardStoreOrderCore(db, { orderId: placed.orderId, partnerId: pinPartner, actorId: "admin-test" });
    expect(again).toMatchObject({ ok: true, partnerId: pinPartner, reassigned: true });
    expect(await orderRow(placed.orderId)).toMatchObject({ partnerId: pinPartner, partnerRef: null, forwardEmailedAt: null, forwardedAt: expect.any(Date) });

    const audit = await scriptDb.select().from(storeAuditLog).where(and(eq(storeAuditLog.entity, "order"), eq(storeAuditLog.entityId, placed.orderId)));
    expect(audit.map((a) => a.action)).toEqual(["order.forward", "order.forward"]);
    expect(audit.every((a) => a.actorUserId === "admin-test")).toBe(true);

    // A delivered order can no longer be forwarded.
    await deliver(placed.orderId);
    const late = await forwardStoreOrderCore(db, { orderId: placed.orderId, partnerId: statePartner, actorId: "admin-test" });
    expect(late).toMatchObject({ ok: false, rule: true });
  });

  it("auto-forwards a placed order to the best partner only when the setting is on", async () => {
    if (!dbAvailable) return;
    const placed = await placeStoreOrderTx(db, order({ shipping: shipTest }));
    if (!placed.ok) throw new Error(placed.error);
    orderIds.push(placed.orderId);

    expect(await autoForwardStoreOrder(db, placed.orderId, { send: false })).toEqual({ forwarded: false, reason: "off" });
    await setSettings({ autoForward: true });
    try {
      const r = await autoForwardStoreOrder(db, placed.orderId, { send: false });
      expect(r).toMatchObject({ forwarded: true, partnerId: partnerIds[0]!, emailed: false });
      expect(await autoForwardStoreOrder(db, placed.orderId, { send: false })).toEqual({ forwarded: false, reason: "already_forwarded" });
      const [audit] = await scriptDb.select().from(storeAuditLog).where(and(eq(storeAuditLog.entityId, placed.orderId), eq(storeAuditLog.action, "order.auto_forward")));
      expect(audit?.actorUserId).toBe("system");

      // An unpaid online order is not ready to hand over.
      const unpaid = await placeStoreOrderTx(db, order({ shipping: shipTest, paymentMode: "online" }));
      if (!unpaid.ok) throw new Error(unpaid.error);
      orderIds.push(unpaid.orderId);
      expect(await autoForwardStoreOrder(db, unpaid.orderId, { send: false })).toEqual({ forwarded: false, reason: "not_ready" });
      await transitionStoreOrder(db, { orderId: unpaid.orderId, to: "cancelled", actor: "customer", actorId: userA, userId: userA });
    } finally {
      await setSettings({ autoForward: false });
    }
  });

  it("keeps the audit log insert-only", async () => {
    if (!dbAvailable) return;
    for (const q of [sql`update store_audit_log set action = 'x' where actor_user_id = 'admin-test'`, sql`delete from store_audit_log where actor_user_id = 'admin-test'`]) {
      let blocked = false;
      try {
        await scriptDb.execute(q);
      } catch {
        blocked = true;
      }
      expect(blocked).toBe(true);
    }
  });

  // ─── Reviews, wishlist, back-in-stock ──────────────────────────────

  let deliveredOrderId = "";
  it("only buyers with a delivered order may review, one review per product", async () => {
    if (!dbAvailable) return;
    const placed = await placeStoreOrderTx(db, order({ userId: userB, items: [{ productId, qty: 2 }] }));
    if (!placed.ok) throw new Error(placed.error);
    orderIds.push(placed.orderId);
    deliveredOrderId = placed.orderId;

    const early = await submitStoreReviewCore(db, { userId: userB, productId, rating: 5, title: "Great", body: "" });
    expect(early.ok).toBe(false);
    await deliver(placed.orderId);
    expect((await orderRow(placed.orderId)).paymentStatus).toBe("paid");

    const stranger = await submitStoreReviewCore(db, { userId: `stranger-${ts}`, productId, rating: 1, title: "", body: "" });
    expect(stranger.ok).toBe(false);
    expect((await submitStoreReviewCore(db, { userId: userB, productId, rating: 9, title: "", body: "" })).ok).toBe(false);

    const first = await submitStoreReviewCore(db, { userId: userB, productId, rating: 5, title: "Great", body: "Loved it" });
    expect(first).toMatchObject({ ok: true, status: "pending" });
    await scriptDb.update(storeProductReviews).set({ status: "published" }).where(and(eq(storeProductReviews.productId, productId), eq(storeProductReviews.userId, userB)));
    // Editing keeps one row and sends it back to moderation.
    const edit = await submitStoreReviewCore(db, { userId: userB, productId, rating: 3, title: "OK", body: "" });
    expect(edit.ok && first.ok && edit.reviewId === first.reviewId).toBe(true);
    const rows = await scriptDb.select().from(storeProductReviews).where(and(eq(storeProductReviews.productId, productId), eq(storeProductReviews.userId, userB)));
    expect(rows.map((r) => [r.rating, r.status, r.orderId])).toEqual([[3, "pending", placed.orderId]]);
  });

  it("wishlist toggles and a back-in-stock alert is sent exactly once", async () => {
    if (!dbAvailable) return;
    expect(await setWishlistCore(db, { userId: userA, productId })).toEqual({ ok: true, wishlisted: true });
    expect(await setWishlistCore(db, { userId: userA, productId, on: true })).toEqual({ ok: true, wishlisted: true });
    expect(await setWishlistCore(db, { userId: userA, productId })).toEqual({ ok: true, wishlisted: false });
    expect((await setWishlistCore(db, { userId: userA, productId: "no-such-product", on: true })).ok).toBe(false);

    // In stock: nothing to wait for.
    expect((await setStockAlertCore(db, { userId: userA, productId, email: "a@example.com", on: true })).ok).toBe(false);
    expect(await stockOf(lastOneId)).toBe(0);
    expect((await setStockAlertCore(db, { userId: userA, productId: lastOneId, email: null, on: true })).ok).toBe(false);
    expect(await setStockAlertCore(db, { userId: userA, productId: lastOneId, email: "a@example.com", on: true })).toEqual({ ok: true, subscribed: true });
    expect(await setStockAlertCore(db, { userId: userB, productId: lastOneId, email: "b@example.com", on: true })).toEqual({ ok: true, subscribed: true });

    // Still sold out: nobody is told yet.
    expect((await sendBackInStockAlerts(db, { productIds: [lastOneId], send: false })).notified).toBe(0);
    await adjustStoreStock(db, { productId: lastOneId, delta: 3, reason: "restock", actor: "admin-test" });
    expect((await sendBackInStockAlerts(db, { productIds: [lastOneId], send: false })).notified).toBe(2);
    expect((await sendBackInStockAlerts(db, { productIds: [lastOneId], send: false })).notified).toBe(0);
    const alerts = await scriptDb.select().from(storeStockAlerts).where(eq(storeStockAlerts.productId, lastOneId));
    expect(alerts.every((a) => a.notifiedAt != null)).toBe(true);
  });

  // ─── Returns ───────────────────────────────────────────────────────

  it("takes a return inside the window, restocks on receipt and refunds", async () => {
    if (!dbAvailable) return;
    const stranger = await requestStoreReturnCore(db, { orderId: deliveredOrderId, userId: userA, reason: "Not mine" });
    expect(stranger.ok).toBe(false);
    const undelivered = await requestStoreReturnCore(db, { orderId: orderIds[0]!, userId: userA, reason: "Too early" });
    expect(undelivered.ok).toBe(false);

    const req = await requestStoreReturnCore(db, { orderId: deliveredOrderId, userId: userB, reason: "Parts missing" });
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    expect((await requestStoreReturnCore(db, { orderId: deliveredOrderId, userId: userB, reason: "Asking twice" })).ok).toBe(false);

    // Out of order moves are refused.
    expect((await moveStoreReturn(db, { returnId: req.returnId, to: "received", actorId: "admin-test" })).ok).toBe(false);
    expect((await refundStoreReturn(db, { returnId: req.returnId, actorId: "admin-test" })).ok).toBe(false);

    expect(await moveStoreReturn(db, { returnId: req.returnId, to: "approved", actorId: "admin-test" })).toMatchObject({ ok: true, status: "approved" });
    const before = await stockOf(productId);
    const received = await moveStoreReturn(db, { returnId: req.returnId, to: "received", actorId: "admin-test" });
    expect(received).toMatchObject({ ok: true, status: "received", restocked: true });
    expect(await stockOf(productId)).toBe(before + 2);
    const moves = await scriptDb.select().from(storeStockMovements).where(and(eq(storeStockMovements.orderId, deliveredOrderId), eq(storeStockMovements.reason, "return")));
    expect(moves.map((m) => m.delta)).toEqual([2]);
    expect(await orderRow(deliveredOrderId)).toMatchObject({ status: "returned", paymentStatus: "refund_due", returnedAt: expect.any(Date) });

    // COD: the cash goes back by hand, recorded as refunded. A second refund is refused.
    const refund = await refundStoreReturn(db, { returnId: req.returnId, actorId: "admin-test", note: "Cash returned" });
    expect(refund).toMatchObject({ ok: true, refundId: null, amountPaise: 60000 });
    expect((await orderRow(deliveredOrderId)).paymentStatus).toBe("refunded");
    expect((await refundStoreReturn(db, { returnId: req.returnId, actorId: "admin-test" })).ok).toBe(false);
    const [ret] = await scriptDb.select().from(storeReturnRequests).where(eq(storeReturnRequests.id, req.returnId));
    expect(ret).toMatchObject({ status: "refunded", approvedAt: expect.any(Date), receivedAt: expect.any(Date), refundedAt: expect.any(Date) });
    const audit = await scriptDb.select().from(storeAuditLog).where(and(eq(storeAuditLog.entity, "return"), eq(storeAuditLog.entityId, req.returnId)));
    expect(audit.map((a) => a.action).sort()).toEqual(["return.approved", "return.received", "return.refunded"]);
  });

  it("refuses a return after the window, and allows a new request after a rejection", async () => {
    if (!dbAvailable) return;
    const old = await placeStoreOrderTx(db, order());
    if (!old.ok) throw new Error(old.error);
    orderIds.push(old.orderId);
    await deliver(old.orderId, new Date(Date.now() - 8 * 24 * 60 * 60_000));
    const late = await requestStoreReturnCore(db, { orderId: old.orderId, userId: userA, reason: "Changed my mind" });
    expect(late).toMatchObject({ ok: false });
    if (!late.ok) expect(late.error).toContain("7-day return window");

    const fresh = await placeStoreOrderTx(db, order());
    if (!fresh.ok) throw new Error(fresh.error);
    orderIds.push(fresh.orderId);
    await deliver(fresh.orderId);
    const first = await requestStoreReturnCore(db, { orderId: fresh.orderId, userId: userA, reason: "Box was open" });
    if (!first.ok) throw new Error(first.error);
    expect(await moveStoreReturn(db, { returnId: first.returnId, to: "rejected", actorId: "admin-test", note: "Seal intact in photos" })).toMatchObject({ ok: true, status: "rejected", restocked: false });
    expect((await orderRow(fresh.orderId)).status).toBe("delivered");
    expect((await requestStoreReturnCore(db, { orderId: fresh.orderId, userId: userA, reason: "Sending better photos" })).ok).toBe(true);

    // Returns switched off.
    await setSettings({ returnWindowDays: 0 });
    try {
      const again = await placeStoreOrderTx(db, order());
      if (!again.ok) throw new Error(again.error);
      orderIds.push(again.orderId);
      await deliver(again.orderId);
      expect((await requestStoreReturnCore(db, { orderId: again.orderId, userId: userA, reason: "Returns are off" })).ok).toBe(false);
    } finally {
      await setSettings({ returnWindowDays: 7 });
    }
  });

  // ─── Bulk catalog tools ────────────────────────────────────────────

  it("imports products from CSV: creates, updates by SKU and reports bad rows", async () => {
    if (!dbAvailable) return;
    const csv = [
      "sku,name,category,price,mrp,stock,active,skills",
      `T-IMP-A-${ts},Imported kit ${ts},${categoryId},499.50,599,7,yes,STEM | Logic`,
      `T-KIT-${ts},,,325,,999,,`,
      `T-IMP-B-${ts},Bad price ${ts},${categoryId},abc,,1,,`,
      `T-IMP-C-${ts},No category ${ts},no-such-category,100,,1,,`,
      `T-IMP-D-${ts},,,100,,1,,`,
      `T-IMP-E-${ts},MRP below price ${ts},${categoryId},500,400,1,,`,
    ].join("\n");

    const dry = await importStoreProductsCore(db, { csv, dryRun: true, actorId: "admin-test" });
    expect(dry).toMatchObject({ dryRun: true, totalRows: 6, created: 1, updated: 1 });
    expect(dry.errors.map((e) => e.line)).toEqual([4, 5, 6, 7]);
    expect((await scriptDb.select().from(storeProducts).where(eq(storeProducts.sku, `T-IMP-A-${ts}`))).length).toBe(0);

    const stockBefore = await stockOf(productId);
    const real = await importStoreProductsCore(db, { csv, actorId: "admin-test" });
    expect(real).toMatchObject({ dryRun: false, created: 1, updated: 1 });
    expect(real.errors.length).toBe(4);
    const [created] = await scriptDb.select().from(storeProducts).where(eq(storeProducts.sku, `T-IMP-A-${ts}`));
    expect(created).toMatchObject({ pricePaise: 49950, mrpPaise: 59900, stock: 7, isActive: true, skills: ["STEM", "Logic"], categoryId });
    const opening = await scriptDb.select().from(storeStockMovements).where(eq(storeStockMovements.productId, created!.id));
    expect(opening.map((m) => [m.delta, m.reason])).toEqual([[7, "restock"]]);
    // The existing product got the new price; its name and stock were left alone.
    const [updated] = await scriptDb.select().from(storeProducts).where(eq(storeProducts.id, productId));
    expect(updated).toMatchObject({ pricePaise: 32500, name: "Test kit", stock: stockBefore });

    const fatal = await importStoreProductsCore(db, { csv: "name,price\nKit,10", actorId: "admin-test" });
    expect(fatal).toMatchObject({ dryRun: true, created: 0, updated: 0 });
    expect(fatal.errors.length).toBe(1);
  });

  it("bulk stock update sets or adds by SKU with a movement per change", async () => {
    if (!dbAvailable) return;
    const before = await stockOf(productId);
    const set = await bulkUpdateStockCore(db, {
      mode: "set",
      rows: [
        { sku: `t-kit-${ts}`, qty: before + 5 },
        { sku: `T-LAST-${ts}`, qty: 3 },
        { sku: "NO-SUCH-SKU", qty: 1 },
        { sku: `T-IMP-A-${ts}`, qty: -1 },
      ],
      actorId: "admin-test",
    });
    expect(set).toMatchObject({ updated: 1, unchanged: 1 });
    expect(set.errors.map((e) => e.sku)).toEqual(["NO-SUCH-SKU", `T-IMP-A-${ts}`]);
    expect(await stockOf(productId)).toBe(before + 5);

    const add = await bulkUpdateStockCore(db, { mode: "add", csv: `sku,stock\nT-KIT-${ts},-5\nT-LAST-${ts},-99`, actorId: "admin-test", note: "Stock take" });
    expect(add).toMatchObject({ updated: 1, unchanged: 0 });
    expect(add.errors.length).toBe(1);
    expect(await stockOf(productId)).toBe(before);
    const [last] = await scriptDb.select().from(storeStockMovements).where(eq(storeStockMovements.productId, productId)).orderBy(sql`created_at desc`).limit(1);
    expect(last).toMatchObject({ delta: -5, reason: "adjust", note: "Stock take", actor: "admin-test" });
  });

  it("stock movements always add up to the stock on the shelf", async () => {
    if (!dbAvailable) return;
    for (const [id, opening] of [
      [productId, 40],
      [lastOneId, 1],
    ] as const) {
      const [sum] = await scriptDb.select({ n: sql<number>`coalesce(sum(delta), 0)::int` }).from(storeStockMovements).where(eq(storeStockMovements.productId, id));
      expect(opening + sum!.n).toBe(await stockOf(id));
    }
  });
});
