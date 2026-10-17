import "server-only";

import { and, count, desc, eq, gte, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  services,
  categories,
  consumers,
  customers,
  ledgerEntries,
  localities,
  platformAdmins,
  platformSettings,
  products,
  shopOrders,
  subscriptions,
  vendorMembers,
  vendorPayouts,
  vendors,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { addDaysIST, todayIST } from "@/core/time";

export async function getAdminVendors() {
  await requireAdmin();
  const db = getDb();

  return db
    .select()
    .from(vendors)
    .orderBy(desc(vendors.createdAt));
}

export async function getAdminOverview() {
  await requireAdmin();
  const db = getDb();
  const today = todayIST();
  const since = new Date(addDaysIST(today, -30) + "T00:00:00+05:30");

  const [vendorRows, [households], [customerCount], [activeSubs], [openOrders], [ordersToday], [shopValue], [planValue], recent] =
    await Promise.all([
      db.select({ status: vendors.status, n: count() }).from(vendors).groupBy(vendors.status),
      db.select({ n: count() }).from(consumers),
      db.select({ n: count() }).from(customers),
      db
        .select({ n: count() })
        .from(subscriptions)
        .where(or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))),
      db
        .select({ n: count() })
        .from(shopOrders)
        .where(inArray(shopOrders.status, ["placed", "accepted", "out_for_delivery"])),
      db.select({ n: count() }).from(shopOrders).where(eq(shopOrders.deliverOn, today)),
      db
        .select({ total: sum(shopOrders.totalPaise) })
        .from(shopOrders)
        .where(and(eq(shopOrders.status, "delivered"), gte(shopOrders.deliveredAt, since))),
      db
        .select({ total: sum(ledgerEntries.amountPaise) })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.type, "delivery"),
            gte(ledgerEntries.createdAt, since),
            sql`${ledgerEntries.idempotencyKey} not like 'shop:%'`
          )
        ),
      db
        .select({ order: shopOrders, vendorName: vendors.name })
        .from(shopOrders)
        .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
        .orderBy(desc(shopOrders.createdAt))
        .limit(8),
    ]);

  const byStatus = Object.fromEntries(vendorRows.map((r) => [r.status, r.n]));
  return {
    vendors: { active: byStatus.active ?? 0, pending: byStatus.pending ?? 0, suspended: byStatus.suspended ?? 0 },
    households: households?.n ?? 0,
    customers: customerCount?.n ?? 0,
    activeSubs: activeSubs?.n ?? 0,
    openOrders: openOrders?.n ?? 0,
    ordersToday: ordersToday?.n ?? 0,
    shopValuePaise: Number(shopValue?.total ?? 0),
    planValuePaise: Number(planValue?.total ?? 0),
    recent,
  };
}

export async function getAdminHouseholds() {
  await requireAdmin();
  const db = getDb();
  const [people, orderCounts, storeCounts] = await Promise.all([
    db.select().from(consumers).orderBy(desc(consumers.createdAt)).limit(300),
    db.select({ userId: shopOrders.userId, n: count() }).from(shopOrders).groupBy(shopOrders.userId),
    db
      .select({ userId: customers.userId, n: count() })
      .from(customers)
      .where(sql`${customers.userId} is not null`)
      .groupBy(customers.userId),
  ]);
  const orders = new Map(orderCounts.map((r) => [r.userId, r.n]));
  const stores = new Map(storeCounts.map((r) => [r.userId, r.n]));
  return people.map((p) => ({ ...p, orders: orders.get(p.userId) ?? 0, stores: stores.get(p.userId) ?? 0 }));
}

export async function getAdminVendorList(q?: string) {
  await requireAdmin();
  const db = getDb();
  const [rows, productCounts, customerCounts] = await Promise.all([
    db.select().from(vendors).orderBy(desc(vendors.createdAt)),
    db.select({ vendorId: products.vendorId, n: count() }).from(products).where(isNull(products.archivedAt)).groupBy(products.vendorId),
    db.select({ vendorId: customers.vendorId, n: count() }).from(customers).groupBy(customers.vendorId),
  ]);
  const p = new Map(productCounts.map((r) => [r.vendorId, r.n]));
  const c = new Map(customerCounts.map((r) => [r.vendorId, r.n]));
  const needle = q?.trim().toLowerCase();
  return rows
    .filter((v) => !needle || [v.name, v.slug, v.city, v.area, v.phone].some((s) => s.toLowerCase().includes(needle)))
    .map((v) => ({ vendor: v, products: p.get(v.id) ?? 0, customers: c.get(v.id) ?? 0 }));
}

export async function getAdminVendor(vendorId: string) {
  await requireAdmin();
  const db = getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) return null;
  const [members, [productCount], [customerCount], [orderCount], [serviceCount], [bookingCount]] = await Promise.all([
    db.select().from(vendorMembers).where(eq(vendorMembers.vendorId, vendorId)),
    db.select({ n: count() }).from(products).where(and(eq(products.vendorId, vendorId), isNull(products.archivedAt))),
    db.select({ n: count() }).from(customers).where(eq(customers.vendorId, vendorId)),
    db.select({ n: count() }).from(shopOrders).where(eq(shopOrders.vendorId, vendorId)),
    db.select({ n: count() }).from(services).where(and(eq(services.vendorId, vendorId), isNull(services.archivedAt))),
    db.select({ n: count() }).from(bookings).where(eq(bookings.vendorId, vendorId)),
  ]);
  return {
    vendor,
    members,
    stats: {
      products: productCount?.n ?? 0,
      customers: customerCount?.n ?? 0,
      orders: orderCount?.n ?? 0,
      services: serviceCount?.n ?? 0,
      bookings: bookingCount?.n ?? 0,
    },
  };
}

export async function getAdminSettings() {
  await requireAdmin();
  const db = getDb();
  const [cats, locs, admins, [settings]] = await Promise.all([
    db.select().from(categories).orderBy(categories.sort, categories.label),
    db.select().from(localities).orderBy(localities.city, localities.name),
    db.select().from(platformAdmins).orderBy(platformAdmins.createdAt),
    db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1),
  ]);
  return { categories: cats, localities: locs, admins, discoveryRadiusKm: settings?.discoveryRadiusKm ?? 10 };
}

/** Counts that need an admin's attention, shown as nav badges. */
export async function getAdminBadges() {
  await requireAdmin();
  const db = getDb();
  const [[pendingVendors], [openPayouts], [refunds]] = await Promise.all([
    db.select({ n: count() }).from(vendors).where(eq(vendors.status, "pending")),
    db.select({ n: count() }).from(vendorPayouts).where(eq(vendorPayouts.status, "requested")),
    db.select({ n: count() }).from(shopOrders).where(eq(shopOrders.paymentStatus, "refund_due")),
  ]);
  return {
    pendingVendors: pendingVendors?.n ?? 0,
    openPayouts: openPayouts?.n ?? 0,
    refunds: refunds?.n ?? 0,
  };
}

export async function getAdminBookings(status?: string) {
  await requireAdmin();
  const db = getDb();
  return db
    .select({ booking: bookings, vendorName: vendors.name, vendorSlug: vendors.slug, customerName: customers.name, serviceName: services.name })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(status ? eq(bookings.status, status) : undefined)
    .orderBy(desc(bookings.startsAt))
    .limit(200);
}
