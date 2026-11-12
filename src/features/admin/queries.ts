import "server-only";
import { cache } from "react";

import { and, count, desc, eq, gte, inArray, isNull, or, sql, sum, ilike } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  services,
  categories,
  consumers,
  customers,
  invoices,
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
import { getCategories } from "@/features/platform/queries";
import { getStoreNewOrdersCount } from "@/features/store/queries";

/** ILIKE pattern for a free-text search; escapes %, _ and \ so they match literally. */
function containsPattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
}

/** Business types an admin can onboard, for /admin/vendors/new and /admin/vendors/new/[type]. */
export type OnboardCategoryRow = Awaited<ReturnType<typeof getOnboardCategories>>[number];

export async function getOnboardCategories() {
  await requireAdmin();
  return (await getCategories()).map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, blurb: c.blurb, fulfilment: c.fulfilment, tint: c.tint, vendorType: c.vendorType }));
}

export async function getAdminOverview() {
  await requireAdmin();
  const db = getDb();
  const today = todayIST();
  const since = new Date(addDaysIST(today, -30) + "T00:00:00+05:30");

  const [
    vendorRows,
    categoryRows,
    [households],
    [customerCount],
    [activeSubs],
    [openOrders],
    [ordersToday],
    [shopValue],
    [planValue],
    [bookingStats],
    [invoiceStats],
    recent,
  ] = await Promise.all([
    db.select({ status: vendors.status, n: count() }).from(vendors).groupBy(vendors.status),
    db
      .select({ categoryId: vendors.categoryId, n: count() })
      .from(vendors)
      .where(eq(vendors.status, "active"))
      .groupBy(vendors.categoryId),
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
      .select({ n: count(), total: sum(bookings.pricePaise) })
      .from(bookings)
      .where(gte(bookings.createdAt, since)),
    db
      .select({
        n: count(),
        charges: sum(invoices.chargesPaise),
        paid: sum(invoices.paymentsPaise),
      })
      .from(invoices),
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
    categoryBreakdown: categoryRows.map((c) => ({ categoryId: c.categoryId ?? "other", count: c.n })),
    households: households?.n ?? 0,
    customers: customerCount?.n ?? 0,
    activeSubs: activeSubs?.n ?? 0,
    openOrders: openOrders?.n ?? 0,
    ordersToday: ordersToday?.n ?? 0,
    shopValuePaise: Number(shopValue?.total ?? 0),
    planValuePaise: Number(planValue?.total ?? 0),
    bookingStats: {
      count: bookingStats?.n ?? 0,
      valuePaise: Number(bookingStats?.total ?? 0),
    },
    invoiceStats: {
      count: invoiceStats?.n ?? 0,
      chargesPaise: Number(invoiceStats?.charges ?? 0),
      paidPaise: Number(invoiceStats?.paid ?? 0),
    },
    recent,
  };
}

export interface AdminHouseholdsOptions {
  q?: string;
  page?: number;
  limit?: number;
}

export async function getAdminHouseholds(optsOrQ?: string | AdminHouseholdsOptions) {
  await requireAdmin();
  const db = getDb();

  const opts: AdminHouseholdsOptions =
    typeof optsOrQ === "string" ? { q: optsOrQ } : optsOrQ ?? {};

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 25));

  // Search, count and paginate in SQL instead of loading every household.
  const needle = opts.q?.trim();
  const pattern = needle ? containsPattern(needle) : null;
  const where = pattern
    ? or(
        ilike(consumers.name, pattern),
        ilike(consumers.phone, pattern),
        ilike(consumers.email, pattern),
        ilike(consumers.flat, pattern),
        ilike(consumers.society, pattern),
        ilike(consumers.area, pattern),
        ilike(consumers.city, pattern)
      )
    : undefined;

  const [[totalRow], people] = await Promise.all([
    db.select({ n: count() }).from(consumers).where(where),
    db
      .select()
      .from(consumers)
      .where(where)
      .orderBy(desc(consumers.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const userIds = people.map((p) => p.userId);
  const [orderCounts, storeCounts] = userIds.length
    ? await Promise.all([
        db.select({ userId: shopOrders.userId, n: count() }).from(shopOrders).where(inArray(shopOrders.userId, userIds)).groupBy(shopOrders.userId),
        db.select({ userId: customers.userId, n: count() }).from(customers).where(inArray(customers.userId, userIds)).groupBy(customers.userId),
      ])
    : [[], []];
  const orders = new Map(orderCounts.map((r) => [r.userId, r.n]));
  const stores = new Map(storeCounts.map((r) => [r.userId, r.n]));

  const total = totalRow?.n ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    people: people.map((p) => ({ ...p, orders: orders.get(p.userId) ?? 0, stores: stores.get(p.userId) ?? 0 })),
    total,
    totalPages,
    page,
    limit,
  };
}

export interface AdminVendorListOptions {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export async function getAdminVendorList(qOrOpts?: string | AdminVendorListOptions) {
  await requireAdmin();
  const db = getDb();

  const opts: AdminVendorListOptions =
    typeof qOrOpts === "string" ? { q: qOrOpts } : qOrOpts ?? {};

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 25));

  // Filter, count and paginate in SQL; per-vendor counts only for the page shown.
  const needle = opts.q?.trim();
  const pattern = needle ? containsPattern(needle) : null;
  const where = and(
    opts.status ? eq(vendors.status, opts.status as (typeof vendors.$inferSelect)["status"]) : undefined,
    opts.categoryId ? eq(vendors.categoryId, opts.categoryId) : undefined,
    pattern
      ? or(
          ilike(vendors.name, pattern),
          ilike(vendors.slug, pattern),
          ilike(vendors.city, pattern),
          ilike(vendors.area, pattern),
          ilike(vendors.phone, pattern),
          ilike(vendors.loginId, pattern)
        )
      : undefined
  );

  const [statusRows, [filteredRow], pageRows] = await Promise.all([
    db.select({ status: vendors.status, n: count() }).from(vendors).groupBy(vendors.status),
    db.select({ n: count() }).from(vendors).where(where),
    db
      .select()
      .from(vendors)
      .where(where)
      .orderBy(desc(vendors.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const ids = pageRows.map((v) => v.id);
  const [productCounts, customerCounts] = ids.length
    ? await Promise.all([
        db
          .select({ vendorId: products.vendorId, n: count() })
          .from(products)
          .where(and(inArray(products.vendorId, ids), isNull(products.archivedAt)))
          .groupBy(products.vendorId),
        db.select({ vendorId: customers.vendorId, n: count() }).from(customers).where(inArray(customers.vendorId, ids)).groupBy(customers.vendorId),
      ])
    : [[], []];
  const p = new Map(productCounts.map((r) => [r.vendorId, r.n]));
  const c = new Map(customerCounts.map((r) => [r.vendorId, r.n]));

  const byStatus = new Map(statusRows.map((r) => [r.status, r.n]));
  const total = filteredRow?.n ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const counts = {
    total: statusRows.reduce((acc, r) => acc + r.n, 0),
    active: byStatus.get("active") ?? 0,
    pending: byStatus.get("pending") ?? 0,
    suspended: byStatus.get("suspended") ?? 0,
  };

  return {
    rows: pageRows.map((v) => ({ vendor: v, products: p.get(v.id) ?? 0, customers: c.get(v.id) ?? 0 })),
    counts,
    total,
    totalPages,
    page,
    limit,
  };
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

/** Counts that need an admin's attention, shown as nav badges. Cached per request: layout and overview both call it. */
export const getAdminBadges = cache(async () => {
  await requireAdmin();
  const db = getDb();
  const [[pendingVendors], [openPayouts], [refunds], newStoreOrders] = await Promise.all([
    db.select({ n: count() }).from(vendors).where(eq(vendors.status, "pending")),
    db.select({ n: count() }).from(vendorPayouts).where(eq(vendorPayouts.status, "requested")),
    db.select({ n: count() }).from(shopOrders).where(eq(shopOrders.paymentStatus, "refund_due")),
    // The store tables arrive with migration 0024; a missing table must not take the console down.
    getStoreNewOrdersCount().catch((err: unknown) => {
      console.error("[admin] store badge failed", err instanceof Error ? err.message : err);
      return 0;
    }),
  ]);
  return {
    pendingVendors: pendingVendors?.n ?? 0,
    openPayouts: openPayouts?.n ?? 0,
    refunds: refunds?.n ?? 0,
    newStoreOrders,
  };
});

export interface AdminBookingsOptions {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getAdminBookings(statusOrOpts?: string | AdminBookingsOptions) {
  await requireAdmin();
  const db = getDb();

  const opts: AdminBookingsOptions =
    typeof statusOrOpts === "string" ? { status: statusOrOpts } : statusOrOpts ?? {};

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 25));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.status) {
    conditions.push(eq(bookings.status, opts.status));
  }
  if (opts.q?.trim()) {
    const term = containsPattern(opts.q.trim());
    conditions.push(
      or(
        ilike(bookings.number, term),
        ilike(vendors.name, term),
        ilike(customers.name, term),
        ilike(customers.phone, term),
        ilike(services.name, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRes, rows] = await Promise.all([
    db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(whereClause),

    db
      .select({
        booking: bookings,
        vendorName: vendors.name,
        vendorSlug: vendors.slug,
        customerName: customers.name,
        serviceName: services.name,
      })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(whereClause)
      .orderBy(desc(bookings.startsAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    rows,
    total,
    totalPages,
    page,
    limit,
  };
}
