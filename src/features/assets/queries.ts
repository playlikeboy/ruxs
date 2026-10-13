import "server-only";

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { assetMovements } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";

export async function getCustomerAssetHistory(slug: string, customerId: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  return db
    .select()
    .from(assetMovements)
    .where(
      and(
        eq(assetMovements.vendorId, access.vendorId),
        eq(assetMovements.customerId, customerId)
      )
    )
    .orderBy(desc(assetMovements.createdAt));
}

export async function getCustomerAssetBalance(
  slug: string,
  customerId: string,
  asset?: string
) {
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  const conditions = [
    eq(assetMovements.vendorId, access.vendorId),
    eq(assetMovements.customerId, customerId),
  ];

  if (asset) {
    conditions.push(eq(assetMovements.asset, asset));
  }

  const [res] = await db
    .select({
      total: sql<number>`coalesce(sum(${assetMovements.delta}), 0)::int`,
    })
    .from(assetMovements)
    .where(and(...conditions));

  return res?.total ?? 0;
}
