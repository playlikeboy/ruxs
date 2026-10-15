import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";

/** Every product, including archived ones, so today's counts still show them. */
export async function getProductsForVendor(slug: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, access.vendorId));

  return rows;
}

export const getVendorProducts = getProductsForVendor;

/** The live menu: everything not archived, grouped order. */
export async function getMenuForVendor(slug: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, access.vendorId), isNull(products.archivedAt)))
    .orderBy(asc(products.kind), asc(products.section), asc(products.name));
  return { rows, role: access.role };
}
