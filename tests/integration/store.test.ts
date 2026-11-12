import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { scriptDb, scriptPool } from "@/db/script-client";
import { storeCategories, storeOrders, storePayments, storeProducts, storeStockMovements } from "@/db/schema";
import {
  adjustStoreStock,
  placeStoreOrderTx,
  releaseExpiredStoreOrders,
  settleStorePayment,
  transitionStoreOrder,
  type StoreDb,
} from "@/features/store/settle";

/**
 * RUXs Store order engine against a disposable database (TEST_DATABASE_URL).
 * Needs migration 0024 applied. Skips when the database is unreachable.
 */
describe("RUXs Store integration", () => {
  let dbAvailable = false;
  const db = scriptDb as unknown as StoreDb;
  const ts = Date.now();
  const categoryId = `test-store-cat-${ts}`;
  const userA = `store-user-a-${ts}`;
  const userB = `store-user-b-${ts}`;
  const ranchi = { latitude: 23.36, longitude: 85.33 };
  const contact = { name: "Test Parent", phone: "+919000000000", address: "Flat 1, Test Society, Ranchi" };
  let productId: string;
  let lastOneId: string;
  const orderIds: string[] = [];

  beforeAll(async () => {
    scriptPool.on("error", () => {});
    try {
      const client = await scriptPool.connect();
      try {
        await client.query("select 1 from store_products limit 1");
        dbAvailable = true;
      } finally {
        client.release();
      }
    } catch {
      console.warn("Test database unreachable or migration 0024 missing; skipping RUXs Store integration tests.");
    }
  });

  afterAll(() => {
    // Stock movements are insert-only (trigger), so test products and orders stay
    // in the disposable database. The pool is shared by every integration file; Bun closes it on exit.
  });

  it("sets up a category and products", async () => {
    if (!dbAvailable) return;
    await scriptDb.insert(storeCategories).values({ id: categoryId, name: "Test aisle" });
    const [p] = await scriptDb
      .insert(storeProducts)
      .values({ slug: `test-kit-${ts}`, sku: `T-KIT-${ts}`, categoryId, name: "Test kit", pricePaise: 30000, stock: 5 })
      .returning({ id: storeProducts.id });
    const [last] = await scriptDb
      .insert(storeProducts)
      .values({ slug: `test-last-${ts}`, sku: `T-LAST-${ts}`, categoryId, name: "Last one", pricePaise: 60000, stock: 1 })
      .returning({ id: storeProducts.id });
    productId = p!.id;
    lastOneId = last!.id;
  });

  it("places a COD order, decrements stock and is idempotent", async () => {
    if (!dbAvailable) return;
    const clientKey = crypto.randomUUID();
    const input = { userId: userA, clientKey, items: [{ productId, qty: 2 }], paymentMode: "cod" as const, contact, point: ranchi };
    const first = await placeStoreOrderTx(db, input);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    orderIds.push(first.orderId);
    expect(first.status).toBe("placed");
    expect(first.orderNumber).toMatch(/^RS-\d{4}-\d{4,}$/);

    const again = await placeStoreOrderTx(db, input);
    expect(again).toMatchObject({ ok: true, orderId: first.orderId, created: false });

    const [p] = await scriptDb.select({ stock: storeProducts.stock }).from(storeProducts).where(eq(storeProducts.id, productId));
    expect(p!.stock).toBe(3);
    const moves = await scriptDb.select().from(storeStockMovements).where(eq(storeStockMovements.orderId, first.orderId));
    expect(moves.map((m) => m.delta)).toEqual([-2]);
  });

  it("refuses addresses outside the geofence", async () => {
    if (!dbAvailable) return;
    const r = await placeStoreOrderTx(db, {
      userId: userA,
      clientKey: crypto.randomUUID(),
      items: [{ productId, qty: 1 }],
      paymentMode: "cod",
      contact,
      point: { latitude: 22.8046, longitude: 86.2029 },
    });
    expect(r.ok).toBe(false);
  });

  it("sells the last unit to exactly one of two concurrent orders", async () => {
    if (!dbAvailable) return;
    const place = (userId: string) =>
      placeStoreOrderTx(db, { userId, clientKey: crypto.randomUUID(), items: [{ productId: lastOneId, qty: 1 }], paymentMode: "cod", contact, point: ranchi });
    const results = await Promise.all([place(userA), place(userB)]);
    const wins = results.filter((r) => r.ok);
    expect(wins.length).toBe(1);
    for (const w of wins) if (w.ok) orderIds.push(w.orderId);
    const [p] = await scriptDb.select({ stock: storeProducts.stock }).from(storeProducts).where(eq(storeProducts.id, lastOneId));
    expect(p!.stock).toBe(0);
  });

  it("settles an online order once, even when called twice", async () => {
    if (!dbAvailable) return;
    const r = await placeStoreOrderTx(db, {
      userId: userB,
      clientKey: crypto.randomUUID(),
      items: [{ productId, qty: 1 }],
      paymentMode: "online",
      contact,
      point: ranchi,
    });
    expect(r.ok && r.status).toBe("awaiting_payment");
    if (!r.ok) return;
    orderIds.push(r.orderId);
    const razorpayOrderId = `order_test_${ts}`;
    await scriptDb.insert(storePayments).values({ orderId: r.orderId, userId: userB, razorpayOrderId, amountPaise: r.totalPaise });

    const s1 = await settleStorePayment({ razorpayOrderId, razorpayPaymentId: `pay_test_${ts}`, amountPaise: r.totalPaise }, db);
    const s2 = await settleStorePayment({ razorpayOrderId, razorpayPaymentId: `pay_test_${ts}`, amountPaise: r.totalPaise }, db);
    expect(s1).toMatchObject({ handled: true, ok: true, firstSettle: true });
    expect(s2).toMatchObject({ handled: true, ok: true, firstSettle: false });
    const [o] = await scriptDb.select().from(storeOrders).where(eq(storeOrders.id, r.orderId));
    expect(o!.status).toBe("placed");
    expect(o!.paymentStatus).toBe("paid");

    expect(await settleStorePayment({ razorpayOrderId: "order_unknown", razorpayPaymentId: "pay_x" }, db)).toEqual({ handled: false });
  });

  it("customer cancel restocks; paid cancel becomes refund_due", async () => {
    if (!dbAvailable) return;
    const [before] = await scriptDb.select({ stock: storeProducts.stock }).from(storeProducts).where(eq(storeProducts.id, productId));
    const paidOrderId = orderIds[orderIds.length - 1]!;
    const r = await transitionStoreOrder(db, { orderId: paidOrderId, to: "cancelled", actor: "customer", actorId: userB, userId: userB });
    expect(r).toMatchObject({ ok: true, restocked: true, paymentStatus: "refund_due" });
    const [after] = await scriptDb.select({ stock: storeProducts.stock }).from(storeProducts).where(eq(storeProducts.id, productId));
    expect(after!.stock).toBe(before!.stock + 1);

    // Someone else's order cannot be cancelled.
    const other = await transitionStoreOrder(db, { orderId: orderIds[0]!, to: "cancelled", actor: "customer", actorId: userB, userId: userB });
    expect(other.ok).toBe(false);
  });

  it("releases expired unpaid holds", async () => {
    if (!dbAvailable) return;
    const r = await placeStoreOrderTx(db, {
      userId: userA,
      clientKey: crypto.randomUUID(),
      items: [{ productId, qty: 1 }],
      paymentMode: "online",
      contact,
      point: ranchi,
      now: new Date(Date.now() - 60 * 60_000),
    });
    if (!r.ok) throw new Error(r.error);
    orderIds.push(r.orderId);
    const res = await releaseExpiredStoreOrders(db);
    expect(res.released).toBeGreaterThanOrEqual(1);
    const [o] = await scriptDb.select({ status: storeOrders.status }).from(storeOrders).where(eq(storeOrders.id, r.orderId));
    expect(o!.status).toBe("cancelled");
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
});
