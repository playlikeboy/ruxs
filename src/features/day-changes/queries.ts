import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { dayChanges, subscriptions, customers, products } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";

export async function getDayChangesForVendor(slug: string, serviceDate: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const rows = await db
    .select({
      change: dayChanges,
      customer: customers,
      product: products,
    })
    .from(dayChanges)
    .innerJoin(subscriptions, eq(dayChanges.subscriptionId, subscriptions.id))
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(
      and(
        eq(dayChanges.vendorId, access.vendorId),
        eq(dayChanges.serviceDate, serviceDate)
      )
    )
    .orderBy(desc(dayChanges.receivedAt));

  return rows;
}
