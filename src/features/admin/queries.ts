import "server-only";

import { and, count, desc, eq, gte, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, customers, ledgerEntries, shopOrders, subscriptions, vendors } from "@/db/schema";
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
