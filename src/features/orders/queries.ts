import "server-only";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, customers, products } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { sortRunSheet } from "@/core/run-sheet";

export async function getRunSheetOrders(
  slug: string,
  serviceDate: string,
  shift?: string
) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const conditions = [
    eq(orders.vendorId, access.vendorId),
    eq(orders.serviceDate, serviceDate),
  ];

  if (shift) {
    conditions.push(eq(orders.shift, shift));
  }

  const rows = await db
    .select({
      order: orders,
      customer: customers,
      product: products,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .where(and(...conditions));

  // Filter out skipped orders from run sheet
  const activeStops = rows
    .filter((r) => r.order.status !== "skipped")
    .map((r) => ({
      ...r,
      society: r.customer.society,
      tower: r.customer.tower,
      floor: r.customer.floor,
      flat: r.customer.flat,
    }));

  return sortRunSheet(activeStops);
}

export async function getTodayOrders(slug: string, serviceDate: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const rows = await db
    .select({
      order: orders,
      product: products,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(
      and(
        eq(orders.vendorId, access.vendorId),
        eq(orders.serviceDate, serviceDate)
      )
    );

  // Group by product
  const countByProduct = new Map<
    string,
    { product: typeof products.$inferSelect; confirmedQty: number; totalOrders: number; skippedCount: number }
  >();

  for (const r of rows) {
    const existing = countByProduct.get(r.product.id) ?? {
      product: r.product,
      confirmedQty: 0,
      totalOrders: 0,
      skippedCount: 0,
    };

    existing.totalOrders += 1;
    if (r.order.status === "confirmed" || r.order.status === "delivered") {
      existing.confirmedQty += r.order.qty;
    } else if (r.order.status === "skipped" || r.order.status === "late_skip") {
      existing.skippedCount += 1;
    }

    countByProduct.set(r.product.id, existing);
  }

  return {
    orders: rows,
    counts: Array.from(countByProduct.values()),
  };
}
