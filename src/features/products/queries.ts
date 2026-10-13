import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";

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
