import "server-only";

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { assetMovements, customers } from "@/db/schema";
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

export async function getVendorInventoryData(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  const [canTotal] = await db
    .select({
      total: sql<number>`coalesce(sum(${assetMovements.delta}), 0)::int`,
    })
    .from(assetMovements)
    .where(
      and(
        eq(assetMovements.vendorId, access.vendorId),
        eq(assetMovements.asset, "can")
      )
    );

  const [dabbaTotal] = await db
    .select({
      total: sql<number>`coalesce(sum(${assetMovements.delta}), 0)::int`,
    })
    .from(assetMovements)
    .where(
      and(
        eq(assetMovements.vendorId, access.vendorId),
        eq(assetMovements.asset, "dabba")
      )
    );

  const customerList = await db
    .select({
      id: customers.id,
      name: customers.name,
      society: customers.society,
      tower: customers.tower,
      flat: customers.flat,
      phone: customers.phone,
    })
    .from(customers)
    .where(eq(customers.vendorId, access.vendorId));

  const balances = await db
    .select({
      customerId: assetMovements.customerId,
      asset: assetMovements.asset,
      total: sql<number>`coalesce(sum(${assetMovements.delta}), 0)::int`,
    })
    .from(assetMovements)
    .where(eq(assetMovements.vendorId, access.vendorId))
    .groupBy(assetMovements.customerId, assetMovements.asset);

  const balanceMap = new Map<string, { can: number; dabba: number }>();
  for (const b of balances) {
    const curr = balanceMap.get(b.customerId) || { can: 0, dabba: 0 };
    if (b.asset === "can") curr.can = b.total;
    if (b.asset === "dabba") curr.dabba = b.total;
    balanceMap.set(b.customerId, curr);
  }

  const customerHoldings = customerList.map((c) => {
    const bal = balanceMap.get(c.id) || { can: 0, dabba: 0 };
    return {
      ...c,
      cansHeld: bal.can,
      dabbasHeld: bal.dabba,
    };
  });

  const recentMovements = await db
    .select({
      id: assetMovements.id,
      customerId: assetMovements.customerId,
      customerName: customers.name,
      flat: customers.flat,
      society: customers.society,
      asset: assetMovements.asset,
      delta: assetMovements.delta,
      createdAt: assetMovements.createdAt,
    })
    .from(assetMovements)
    .innerJoin(customers, eq(assetMovements.customerId, customers.id))
    .where(eq(assetMovements.vendorId, access.vendorId))
    .orderBy(desc(assetMovements.createdAt))
    .limit(20);

  return {
    vendor: access.vendor,
    cansTotal: canTotal?.total ?? 0,
    dabbasTotal: dabbaTotal?.total ?? 0,
    customerHoldings,
    recentMovements,
  };
}
