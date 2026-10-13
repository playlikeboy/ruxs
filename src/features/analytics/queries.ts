import "server-only";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";
import { todayIST } from "@/core/time";
import { requireVendorAccess } from "@/lib/auth/session";

export async function getVendorAnalytics(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const toDate = todayIST(new Date());
  const startDate = new Date(toDate + "T12:00:00.000Z");
  startDate.setUTCDate(startDate.getUTCDate() - 29);
  const fromDate = startDate.toISOString().slice(0, 10);

  const dateConditions = [
    eq(orders.vendorId, access.vendorId),
    gte(orders.serviceDate, fromDate),
    lte(orders.serviceDate, toDate),
  ];

  const byStatus = await db
    .select({
      status: orders.status,
      orderCount: sql<number>`count(*)::int`,
      units: sql<number>`coalesce(sum(${orders.qty}), 0)::int`,
      deliveredValuePaise: sql<number>`coalesce(sum(case when ${orders.status} = 'delivered' then ${orders.unitPricePaise} * ${orders.qty} else 0 end), 0)::int`,
    })
    .from(orders)
    .where(and(...dateConditions))
    .groupBy(orders.status);

  const byProduct = await db
    .select({
      productId: products.id,
      productName: products.name,
      kind: products.kind,
      shift: products.shift,
      orderCount: sql<number>`count(${orders.id})::int`,
      deliveredOrders: sql<number>`count(case when ${orders.status} = 'delivered' then 1 end)::int`,
      deliveredUnits: sql<number>`coalesce(sum(case when ${orders.status} = 'delivered' then ${orders.qty} else 0 end), 0)::int`,
      deliveredValuePaise: sql<number>`coalesce(sum(case when ${orders.status} = 'delivered' then ${orders.unitPricePaise} * ${orders.qty} else 0 end), 0)::int`,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(and(...dateConditions))
    .groupBy(products.id, products.name, products.kind, products.shift)
    .orderBy(desc(sql`coalesce(sum(case when ${orders.status} = 'delivered' then ${orders.unitPricePaise} * ${orders.qty} else 0 end), 0)`));

  return { fromDate, toDate, byStatus, byProduct };
}
