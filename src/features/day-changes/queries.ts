import "server-only";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { dayChanges } from "@/db/schema";
import { requireVendorAccess, requireCustomerByToken } from "@/lib/auth/session";

export async function getDayChangesForVendor(slug: string, serviceDate: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const rows = await db
    .select()
    .from(dayChanges)
    .where(
      and(
        eq(dayChanges.vendorId, access.vendorId),
        eq(dayChanges.serviceDate, serviceDate)
      )
    );

  return rows;
}

export async function getDayChangesForCustomer(token: string) {
  const { customer, vendorId } = await requireCustomerByToken(token);
  const db = getDb();

  const rows = await db
    .select()
    .from(dayChanges)
    .where(eq(dayChanges.vendorId, vendorId));

  return { customer, changes: rows };
}
