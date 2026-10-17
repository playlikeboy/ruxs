import "server-only";
import { and, desc, eq, inArray, ne, or, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, customers, shopOrderItems, shopOrders, vendors } from "@/db/schema";
import { requireAdmin, requireVendorAccess } from "@/lib/auth/session";
import { addDaysIST, todayIST } from "@/core/time";

const OPEN = ["placed", "accepted", "out_for_delivery"];

async function withItems<T extends { order: { id: string } }>(rows: T[]) {
  const db = getDb();
  const ids = rows.map((r) => r.order.id);
  const items = ids.length ? await db.select().from(shopOrderItems).where(inArray(shopOrderItems.orderId, ids)) : [];
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.order.id) }));
}

/** Orders for the merchant panel. Households' phone is visible to the store that delivers. */
export async function getVendorShopOrders(slug: string, view: "open" | "done") {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const since = addDaysIST(todayIST(), -14);

  const rows = await db
    .select({
      order: shopOrders,
      customerName: customers.name,
      customerPhone: customers.phone,
      latitude: consumers.latitude,
      longitude: consumers.longitude,
    })
    .from(shopOrders)
    .innerJoin(customers, eq(shopOrders.customerId, customers.id))
    .leftJoin(consumers, eq(customers.userId, consumers.userId))
    .where(
      and(
        eq(shopOrders.vendorId, access.vendorId),
        view === "open"
          ? inArray(shopOrders.status, OPEN)
          : and(
              inArray(shopOrders.status, ["delivered", "cancelled", "rejected"]),
              gte(shopOrders.deliverOn, since),
              // Online orders abandoned before payment never reached the store.
              or(ne(shopOrders.paymentMode, "online"), ne(shopOrders.paymentStatus, "unpaid"))
            )
      )
    )
    .orderBy(view === "open" ? shopOrders.createdAt : desc(shopOrders.updatedAt))
    .limit(100);

  return { orders: await withItems(rows), role: access.role };
}

export async function countOpenShopOrders(vendorId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: shopOrders.id })
    .from(shopOrders)
    .where(and(eq(shopOrders.vendorId, vendorId), eq(shopOrders.status, "placed")));
  return rows.length;
}

export async function getAdminShopOrders(status?: string) {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select({
      order: shopOrders,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      customerName: customers.name,
    })
    .from(shopOrders)
    .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
    .innerJoin(customers, eq(shopOrders.customerId, customers.id))
    .where(status ? eq(shopOrders.status, status) : undefined)
    .orderBy(desc(shopOrders.createdAt))
    .limit(200);
  return withItems(rows);
}
