import "server-only";
import { cache } from "react";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets } from "@/db/schema";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";

/** Households can only see their own tickets */
export const getMyTickets = cache(async () => {
  const user = await requireUser();
  const db = getDb();
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, user.id))
    .orderBy(desc(supportTickets.createdAt));
});

/** Single ticket lookup ensuring the household owns it (or caller is admin) */
export async function getMyTicket(ticketId: string) {
  const user = await requireUser();
  const db = getDb();
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, user.id)))
    .limit(1);
  return ticket ?? null;
}

/** Vendor dispute view: vendorId strictly from requireVendorAccess */
export async function getVendorTickets(slug: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.vendorId, access.vendorId))
    .orderBy(desc(supportTickets.createdAt));
}

/** Admin console view for tickets */
export async function getAdminTickets(opts?: { status?: string; category?: string }) {
  await requireAdmin();
  const db = getDb();

  const conditions = [];
  if (opts?.status) conditions.push(eq(supportTickets.status, opts.status));
  if (opts?.category) conditions.push(eq(supportTickets.category, opts.category));

  return db
    .select()
    .from(supportTickets)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(supportTickets.createdAt))
    .limit(100);
}
