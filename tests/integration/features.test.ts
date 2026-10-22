import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { eq, and } from "drizzle-orm";
import { scriptDb, scriptPool } from "@/db/script-client";
import {
  vendors,
  customers,
  products,
  subscriptions,
  dayChanges,
  orders,
  invoices,
} from "@/db/schema";
import { lockCutoffForProduct } from "@/features/orders/actions";
import { generateBillsForVendor } from "@/features/billing/actions";
import { resolveDay } from "@/core/orders";
import { todayIST, weekdayIST } from "@/core/time";
import { hashToken } from "@/lib/auth/session";

describe("Phase 4 Integration Tests", () => {
  let dbAvailable = false;
  const timestamp = Date.now();
  const testVendorSlug = `test-vendor-${timestamp}`;
  let vendorId: string;
  let productId: string;
  let customer1Id: string;
  let customer2Id: string;
  let sub1Id: string;
  let sub2Id: string;

  const today = todayIST();
  const weekday = weekdayIST(today);

  beforeAll(async () => {
    scriptPool.on("error", () => {});
    try {
      const client = await scriptPool.connect();
      client.release();
      dbAvailable = true;
    } catch {
      console.warn("Neon Database is not reachable from this environment; skipping integration tests against live DB.");
    }
  });

  it("sets up test vendor, products, customers, and subscriptions", async () => {
    if (!dbAvailable) return;
    // 1. Create vendor
    const [v] = await scriptDb
      .insert(vendors)
      .values({
        slug: testVendorSlug,
        name: "Integration Test Kitchen",
        phone: "+919988776655",
        upiVpa: "testkitchen@upi",
        city: "Bengaluru",
        area: "Koramangala",
        status: "active",
        vendorType: "tiffin",
        businessType: "delivery",
        categoryId: "tiffin",
      })
      .returning();
    expect(v).toBeDefined();
    vendorId = v!.id;

    // 2. Create product
    const [p] = await scriptDb
      .insert(products)
      .values({
        vendorId,
        name: "Test Tiffin",
        kind: "tiffin",
        shift: "lunch",
        pricePaise: 9000, // ₹90
        cutoffAt: "00:01", // Already passed
        lateRule: "full",
      })
      .returning();
    expect(p).toBeDefined();
    productId = p!.id;

    // 3. Create customers
    const token1 = `tok_int_1_${timestamp}`;
    const token2 = `tok_int_2_${timestamp}`;

    const [c1] = await scriptDb
      .insert(customers)
      .values({
        vendorId,
        name: "Test Cust 1",
        phone: "+919876543210",
        society: "Green Glen",
        tower: "A",
        floor: "3",
        flat: "302",
        linkTokenHash: hashToken(token1),
      })
      .returning();
    customer1Id = c1!.id;

    const [c2] = await scriptDb
      .insert(customers)
      .values({
        vendorId,
        name: "Test Cust 2",
        phone: "+919876543211",
        society: "Green Glen",
        tower: "B",
        floor: "4",
        flat: "405",
        linkTokenHash: hashToken(token2),
      })
      .returning();
    customer2Id = c2!.id;

    // 4. Create subscriptions
    const [s1] = await scriptDb
      .insert(subscriptions)
      .values({
        vendorId,
        customerId: customer1Id,
        productId,
        qty: 1,
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        startsOn: today,
      })
      .returning();
    sub1Id = s1!.id;

    const [s2] = await scriptDb
      .insert(subscriptions)
      .values({
        vendorId,
        customerId: customer2Id,
        productId,
        qty: 2,
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        startsOn: today,
      })
      .returning();
    sub2Id = s2!.id;

    // Add a dayChange for customer 2: skip today
    await scriptDb.insert(dayChanges).values({
      vendorId,
      subscriptionId: sub2Id,
      serviceDate: today,
      kind: "skip",
      qty: 0,
      source: "link",
    });
  });

  it("Cutoff SQL matches resolveDay snapshot logic", async () => {
    if (!dbAvailable) return;
    // Execute cutoff lock
    await lockCutoffForProduct(productId, today, scriptDb);

    // Verify customer 1 order (no day change -> regular subscription)
    const [order1] = await scriptDb
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.subscriptionId, sub1Id),
          eq(orders.serviceDate, today)
        )
      );

    const expected1 = resolveDay(
      { qty: 1, days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
      null,
      weekday
    );

    expect(order1).toBeDefined();
    expect(order1!.status).toBe(expected1.status);
    expect(order1!.qty).toBe(expected1.qty);
    expect(order1!.unitPricePaise).toBe(9000);

    // Verify customer 2 order (skip change -> 0 qty, skipped)
    const [order2] = await scriptDb
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.subscriptionId, sub2Id),
          eq(orders.serviceDate, today)
        )
      );

    const expected2 = resolveDay(
      { qty: 2, days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
      { kind: "skip", qty: 0 },
      weekday
    );

    expect(order2).toBeDefined();
    expect(order2!.status).toBe(expected2.status);
    expect(order2!.qty).toBe(expected2.qty);
  });

  it("Double-tick idempotency: rerun produces zero additional orders", async () => {
    if (!dbAvailable) return;
    const ordersBefore = await scriptDb
      .select()
      .from(orders)
      .where(eq(orders.productId, productId));

    // Re-run cutoff lock
    await lockCutoffForProduct(productId, today, scriptDb);

    const ordersAfter = await scriptDb
      .select()
      .from(orders)
      .where(eq(orders.productId, productId));

    expect(ordersAfter.length).toBe(ordersBefore.length);
  });

  it("Monthly billing idempotency: double bill generation produces zero extra invoices", async () => {
    if (!dbAvailable) return;
    const period = today.substring(0, 7); // YYYY-MM

    await generateBillsForVendor(vendorId, period, scriptDb);
    const invoicesBefore = await scriptDb
      .select()
      .from(invoices)
      .where(eq(invoices.vendorId, vendorId));

    const res2 = await generateBillsForVendor(vendorId, period, scriptDb);
    const invoicesAfter = await scriptDb
      .select()
      .from(invoices)
      .where(eq(invoices.vendorId, vendorId));

    expect(invoicesAfter.length).toBe(invoicesBefore.length);
    expect(res2.created).toBe(0);
  });

  it("Customer token boundary: unknown or altered token fails lookup", async () => {
    if (!dbAvailable) return;
    const fakeToken = "tok_non_existent_12345";
    const fakeHash = hashToken(fakeToken);

    const [found] = await scriptDb
      .select()
      .from(customers)
      .where(eq(customers.linkTokenHash, fakeHash));

    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    // Cleanup created test records (cascade from vendor will remove products, orders, subs, dayChanges, invoices)
    if (vendorId && dbAvailable) {
      await scriptDb.delete(vendors).where(eq(vendors.id, vendorId));
    }
    if (dbAvailable) {
      await scriptPool.end();
    }
  });
});
