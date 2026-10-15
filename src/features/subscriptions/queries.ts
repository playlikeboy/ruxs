import "server-only";
import { eq, and, desc, count, gte, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions, products, customers } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";

export async function getSubscriptionsForCustomer(slug: string, customerId: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const rows = await db
    .select({
      subscription: subscriptions,
      product: products,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(
      and(
        eq(subscriptions.vendorId, access.vendorId),
        eq(subscriptions.customerId, customerId)
      )
    );

  return rows;
}

/** Every subscription in the business, newest first, with who and what. */
export async function getVendorSubscriptions(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  return db
    .select({
      subscription: subscriptions,
      product: products,
      customerId: customers.id,
      customerName: customers.name,
      flat: customers.flat,
      tower: customers.tower,
      society: customers.society,
      fromApp: customers.userId,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .where(eq(subscriptions.vendorId, access.vendorId))
    .orderBy(desc(subscriptions.createdAt));
}

/** Active plans per product (not ended), for the Today dashboard. */
export async function countActivePlansByProduct(slug: string, today: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const rows = await db
    .select({ productId: subscriptions.productId, n: count() })
    .from(subscriptions)
    .where(and(eq(subscriptions.vendorId, access.vendorId), or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))))
    .groupBy(subscriptions.productId);
  return new Map(rows.map((r) => [r.productId, r.n]));
}
