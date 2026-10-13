import "server-only";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions, products } from "@/db/schema";
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
