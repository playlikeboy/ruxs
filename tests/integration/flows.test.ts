/**
 * End-to-end flows through the real server actions against a disposable
 * database: a household orders or books, the merchant sees and handles it,
 * it ends delivered/done and paid, and each side is notified.
 * Only auth, cache revalidation and the email/push sender are stubbed.
 */
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";

type Recorded = { to: string; kind: string };
const sent: Recorded[] = [];
let currentUser = { id: "household-user", primaryEmail: "home@example.com", displayName: "Riya" };

mock.module("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: (fn: unknown) => fn }));
mock.module("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set() {}, delete() {} }), headers: async () => new Headers() }));
mock.module("@/features/notifications/dispatch", () => ({
  notifyAfter: (ids: string[] | (() => Promise<string[]>), e: { kind: string }) => {
    if (Array.isArray(ids)) ids.forEach((to) => sent.push({ to, kind: e.kind }));
  },
  notifyVendorAfter: (vendorId: string, e: { kind: string }) => sent.push({ to: `vendor:${vendorId}`, kind: e.kind }),
  notifyUsers: async () => {},
  vendorRecipientIds: async () => [],
}));
mock.module("@/lib/auth/session", () => ({
  requireUser: async () => currentUser,
  requireVendorAccess: async (slug: string) => {
    const { getDb } = await import("@/db");
    const { vendors } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [vendor] = await getDb().select().from(vendors).where(eq(vendors.slug, slug)).limit(1);
    if (!vendor) throw new Error("no vendor " + slug);
    return { vendorId: vendor.id, vendor, role: "owner", user: { id: "merchant-user" } };
  },
  requireAdmin: async () => ({ user: { id: "admin" } }),
  isUserAdmin: async () => false,
  hashToken: (s: string) => s,
}));

const { scriptDb, scriptPool } = await import("@/db/script-client");
const schema = await import("@/db/schema");
const { eq } = await import("drizzle-orm");
const { placeOrder, confirmMyOrderDelivered } = await import("@/features/consumer/actions");
const { updateShopOrderStatus } = await import("@/features/shop-orders/actions");
const { bookSession, markBooking } = await import("@/features/bookings/actions");
const { bookKidsServiceAction, providerKidsBookingAction, saveKidsServiceAction } = await import("@/features/kids/actions");
const { VENDOR_TYPES, canUseModule } = await import("@/core/vendor-types");
const { priceBreakup } = await import("@/core/pricing");
const { addDaysIST, istDateTime, todayIST, weekdayIST } = await import("@/core/time");

const ts = Date.now().toString(36);
const LAT = 23.3441;
const LNG = 85.3096;
const vendorIds: string[] = [];
let dbAvailable = false;

async function makeVendor(type: string, category: string, businessType: "delivery" | "booking", extra: Partial<typeof schema.vendors.$inferInsert> = {}) {
  const [v] = await scriptDb
    .insert(schema.vendors)
    .values({
      slug: `e2e-${type}-${ts}`,
      name: `E2E ${type}`,
      phone: "+919876500000",
      upiVpa: "e2e@upi",
      city: "Ranchi",
      area: "Morabadi",
      status: "active",
      acceptingOrders: true,
      vendorType: type,
      businessType,
      categoryId: category,
      latitude: LAT,
      longitude: LNG,
      serviceRadiusKm: 10,
      ...extra,
    })
    .returning();
  vendorIds.push(v!.id);
  return v!;
}

beforeAll(async () => {
  scriptPool.on("error", () => {});
  try {
    (await scriptPool.connect()).release();
    dbAvailable = true;
  } catch {
    console.warn("No test database; skipping end-to-end flows.");
    return;
  }
  // Categories admins add in production; fresh databases only seed the core ones.
  for (const [id, vendorType, fulfilment] of [["gifts", "gifts", "delivery"], ["mehndi", "mehndi", "booking"]] as const) {
    await scriptDb.insert(schema.categories).values({ id, label: id, shortLabel: id, emoji: "", blurb: "", vendorType, fulfilment }).onConflictDoNothing();
  }
  await scriptDb
    .insert(schema.consumers)
    .values({ userId: currentUser.id, name: "Riya", phone: "9876511111", email: "home@example.com", society: "Green Park", tower: "A", floor: "3", flat: "301", area: "Morabadi", city: "Ranchi", latitude: LAT, longitude: LNG })
    .onConflictDoNothing();
});

// No cleanup: the test database is disposable, and the append-only ledger
// (correctly) refuses deletes that would cascade from vendors.
afterAll(() => {});

describe("app orders, every delivery vendor type", () => {
  for (const type of ["tiffin", "water", "milk", "store", "gifts"] as const) {
    it(`${type}: order → accepted → delivered → paid, with GST and discount on the bill`, async () => {
      if (!dbAvailable) return;
      sent.length = 0;
      const category = type === "store" ? "other" : type;
      const vendor = await makeVendor(type, category, "delivery", { gstBps: 500, pricesIncludeGst: false, discountBps: 1000, deliveryFeePaise: 2000 });
      const [product] = await scriptDb
        .insert(schema.products)
        .values({ vendorId: vendor.id, kind: category, name: `${type} item`, shift: "lunch", pricePaise: 10000, cutoffAt: "23:59", allowOneTime: true, isAvailable: true })
        .returning();

      const placed = await placeOrder({ clientKey: crypto.randomUUID(), vendorSlug: vendor.slug, items: [{ productId: product!.id, qty: 3 }], deliverOn: "today", slot: "asap", paymentMode: "cod" });
      expect(placed.ok).toBe(true);
      if (!placed.ok) return;
      const [order] = await scriptDb.select().from(schema.shopOrders).where(eq(schema.shopOrders.id, placed.orderId));
      const bill = priceBreakup(30000, 2000, { gstBps: 500, pricesIncludeGst: false, discountBps: 1000, commissionBps: 0 });
      expect(order).toMatchObject({ status: "placed", subtotalPaise: 30000, discountPaise: 3000, gstPaise: bill.gstPaise, totalPaise: bill.totalPaise });
      expect(sent.map((s) => s.kind)).toEqual(expect.arrayContaining(["vendor.order.new", "customer.order.placed"]));

      for (const to of ["accepted", "out_for_delivery", "delivered"] as const) {
        const moved = await updateShopOrderStatus({ slug: vendor.slug, orderId: order!.id, to });
        expect(moved.ok).toBe(true);
      }
      const confirmed = await confirmMyOrderDelivered({ orderId: order!.id });
      expect(confirmed.ok).toBe(true);

      const [done] = await scriptDb.select().from(schema.shopOrders).where(eq(schema.shopOrders.id, order!.id));
      expect(done!.status).toBe("delivered");
      const ledger = await scriptDb.select().from(schema.ledgerEntries).where(eq(schema.ledgerEntries.vendorId, vendor.id));
      expect(ledger.length).toBeGreaterThanOrEqual(2);
      expect(ledger.reduce((s, l) => s + l.amountPaise, 0)).toBe(0); // charged and paid on delivery
      expect(sent.filter((s) => s.kind === "customer.order.status").length).toBeGreaterThanOrEqual(2);
    }, 30000);
  }
});

describe("bookings, every booking vendor type", () => {
  for (const type of ["fitness", "physio", "mehndi"] as const) {
    it(`${type}: book → confirmed and both told; provider closes a session as done and paid`, async () => {
      if (!dbAvailable) return;
      sent.length = 0;
      const vendor = await makeVendor(type, type, "booking");
      const [service] = await scriptDb.insert(schema.services).values({ vendorId: vendor.id, categoryId: type, name: `${type} session`, durationMinutes: 60, pricePaise: 50000, modes: ["studio"] }).returning();
      const day = addDaysIST(todayIST(), 2);
      await scriptDb.insert(schema.availabilityRules).values({ vendorId: vendor.id, weekday: weekdayIST(day), startTime: "09:00", endTime: "18:00" });

      const res = await bookSession({ clientKey: crypto.randomUUID(), serviceId: service!.id, startsAt: istDateTime(day, "10:00").toISOString(), mode: "studio", paymentMode: "pay_at_session" });
      expect(res.ok).toBe(true);
      expect(sent.map((s) => s.kind)).toEqual(expect.arrayContaining(["vendor.booking.new", "customer.booking.confirmed"]));

      // A session that already started: the provider marks it done, money collected in person.
      const [cust] = await scriptDb.select().from(schema.customers).where(eq(schema.customers.vendorId, vendor.id));
      const startedAt = new Date(Date.now() - 2 * 3600_000);
      const [past] = await scriptDb
        .insert(schema.bookings)
        .values({ number: `BK-E2E-${type}-${ts}`, clientKey: crypto.randomUUID(), vendorId: vendor.id, customerId: cust!.id, userId: currentUser.id, serviceId: service!.id, startsAt: startedAt, endsAt: new Date(startedAt.getTime() + 3600_000), mode: "studio", pricePaise: 50000, paymentMode: "pay_at_session", status: "confirmed" })
        .returning();
      const closed = await markBooking({ slug: vendor.slug, bookingId: past!.id, outcome: "done" });
      expect(closed.ok).toBe(true);
      const [after] = await scriptDb.select().from(schema.bookings).where(eq(schema.bookings.id, past!.id));
      expect(after).toMatchObject({ status: "done", paymentStatus: "paid" });
    }, 30000);
  }
});

describe("kids classes, every kids class type", () => {
  for (const type of VENDOR_TYPES.filter((t) => canUseModule(t, "kids"))) it(`${type}: provider lists a class → parent requests → provider accepts → parent told; past session completed and paid`, async () => {
    if (!dbAvailable) return;
    sent.length = 0;
    const vendor = await makeVendor(type, type, "booking");
    await scriptDb.insert(schema.kidsProviderProfiles).values({ vendorId: vendor.id, verificationStatus: "approved", safetyReviewStatus: "passed" });
    // Through the merchant's own action, so vendor-type gates and DB triggers are exercised.
    const saved = await saveKidsServiceAction({ slug: vendor.slug, categoryId: "stem", title: "E2E Dance", minAge: 4, maxAge: 12, durationMinutes: 60, deliveryModes: ["studio"], priceRupees: 400 });
    expect(saved).toMatchObject({ ok: true });
    if (!saved.ok) return;
    const [service] = await scriptDb.select().from(schema.kidsServices).where(eq(schema.kidsServices.id, saved.serviceId));
    const [child] = await scriptDb.insert(schema.kidsChildren).values({ guardianUserId: currentUser.id, displayName: "Aarav", birthYear: 2018 }).returning();

    const day = addDaysIST(todayIST(), 3);
    await scriptDb.insert(schema.availabilityRules).values({ vendorId: vendor.id, weekday: weekdayIST(day), startTime: "10:00", endTime: "19:00" });
    const startsAt = istDateTime(day, "16:30");
    const res = await bookKidsServiceAction({ serviceId: service!.id, childId: child!.id, startsAt: startsAt.toISOString(), deliveryMode: "studio", paymentMode: "pay_at_session", clientKey: crypto.randomUUID() });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const [requested] = await scriptDb.select().from(schema.kidsServiceBookings).where(eq(schema.kidsServiceBookings.id, res.bookingId));
    expect(requested!.bookingStatus).toBe("held");

    const accepted = await providerKidsBookingAction({ slug: vendor.slug, bookingId: res.bookingId, action: "accept" });
    expect(accepted.ok).toBe(true);
    const [confirmed] = await scriptDb.select().from(schema.kidsServiceBookings).where(eq(schema.kidsServiceBookings.id, res.bookingId));
    expect(confirmed!.bookingStatus).toBe("confirmed");

    const started = new Date(Date.now() - 3 * 3600_000);
    const [past] = await scriptDb
      .insert(schema.kidsServiceBookings)
      .values({ number: `KBK-E2E-${ts}`, clientKey: crypto.randomUUID(), serviceId: service!.id, vendorId: vendor.id, guardianUserId: currentUser.id, childId: child!.id, startsAt: started, endsAt: new Date(started.getTime() + 3600_000), deliveryMode: "studio", priceSnapshotPaise: 40000, bookingStatus: "confirmed" })
      .returning();
    const completed = await providerKidsBookingAction({ slug: vendor.slug, bookingId: past!.id, action: "completed" });
    expect(completed.ok).toBe(true);
    const [after] = await scriptDb.select().from(schema.kidsServiceBookings).where(eq(schema.kidsServiceBookings.id, past!.id));
    expect(after).toMatchObject({ bookingStatus: "completed", paymentStatus: "paid" });

    await scriptDb.delete(schema.kidsServiceBookings).where(eq(schema.kidsServiceBookings.vendorId, vendor.id));
    await scriptDb.delete(schema.kidsChildren).where(eq(schema.kidsChildren.id, child!.id));
  }, 30000);
});

describe("new vendors start with a menu and are listed nearby", () => {
  it("every vendor type: starter catalogue passes the type triggers and the store shows in Stores near you", async () => {
    if (!dbAvailable) return;
    const { seedStarterCatalog } = await import("@/features/vendor-types/starter");
    const { listStores } = await import("@/features/consumer/queries");
    const slugs: string[] = [];
    for (const type of VENDOR_TYPES) {
      const fulfilment = canUseModule(type, "products") ? "delivery" : "booking";
      const category = type === "store" ? "other" : type;
      const vendor = await makeVendor(type, category, fulfilment, { slug: `e2e-starter-${type}-${ts}` });
      if (canUseModule(type, "kids")) await scriptDb.insert(schema.kidsProviderProfiles).values({ vendorId: vendor.id, verificationStatus: "approved", safetyReviewStatus: "passed" });
      const added = await scriptDb.transaction((tx) => seedStarterCatalog(tx, { id: vendor.id, vendorType: type, categoryId: category }));
      expect(added, type).toBeGreaterThan(0);
      slugs.push(vendor.slug);
    }
    const listed = new Set((await listStores({ latitude: LAT, longitude: LNG })).map((s) => s.slug));
    for (const slug of slugs) expect(listed.has(slug), slug).toBe(true);

    const found = await listStores({ q: "veg thali", latitude: LAT, longitude: LNG });
    expect(found.some((s) => s.slug === `e2e-starter-tiffin-${ts}`)).toBe(true);
  }, 60000);
});
