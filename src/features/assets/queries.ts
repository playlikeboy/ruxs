import "server-only";

import { eq, and, desc, asc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { assetMovements, customers, products } from "@/db/schema";
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
      total: sql<number>\`coalesce(sum(\${assetMovements.delta}), 0)::int\`,
    })
    .from(assetMovements)
    .where(and(...conditions));

  return res?.total ?? 0;
}

/**
 * The inventory view is based on the existing append-only can/dabba movement
 * history. Positive balances mean assets are currently out with households.
 */
export async function getVendorAssetOverview(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  const configuredAssets = await db
    .select({ asset: products.assetName })
    .from(products)
    .where(eq(products.vendorId, access.vendorId));

  const balances = await db
    .select({
      asset: assetMovements.asset,
      customerId: assetMovements.customerId,
      customerName: customers.name,
      society: customers.society,
      tower: customers.tower,
      floor: customers.floor,
      flat: customers.flat,
      balance: sql<number>\`coalesce(sum(\${assetMovements.delta}), 0)::int\`,
    })
    .from(assetMovements)
    .innerJoin(customers, eq(assetMovements.customerId, customers.id))
    .where(eq(assetMovements.vendorId, access.vendorId))
    .groupBy(
      assetMovements.asset,
      assetMovements.customerId,
      customers.name,
      customers.society,
      customers.tower,
      customers.floor,
      customers.flat
    )
    .orderBy(
      asc(customers.society),
      asc(customers.tower),
      desc(customers.floor),
      asc(customers.flat)
    );

  const outstandingRows = balances.filter((row) => Number(row.balance) !== 0);
  const assetNames = Array.from(
    new Set([
      ...configuredAssets.map((row) => row.asset).filter((asset): asset is string => Boolean(asset)),
      ...balances.map((row) => row.asset),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const assets = assetNames.map((asset) => {
    const rows = outstandingRows.filter((row) => row.asset === asset);
    return {
      asset,
      outstanding: rows.reduce((sum, row) => sum + Number(row.balance), 0),
      households: new Set(rows.map((row) => row.customerId)).size,
    };
  });

  return { assets, householdBalances: outstandingRows };
}
