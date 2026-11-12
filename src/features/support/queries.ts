import "server-only";
import { cache } from "react";
import { and, desc, eq, count } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets } from "@/db/schema";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";

type TicketRow = typeof supportTickets.$inferSelect;

/** Admin notes are internal: households and stores never receive them. */
function withoutAdminNotes(ticket: TicketRow): TicketRow {
  return { ...ticket, adminNotes: null };
}

/** Households can only see their own tickets */
export const getMyTickets = cache(async () => {
  const user = await requireUser();
  const db = getDb();
  const rows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, user.id))
    .orderBy(desc(supportTickets.createdAt));
  return rows.map(withoutAdminNotes);
});

/** Single ticket lookup ensuring the household owns it */
export async function getMyTicket(ticketId: string) {
  const user = await requireUser();
  const db = getDb();
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, user.id)))
    .limit(1);
  return ticket ? withoutAdminNotes(ticket) : null;
}

/** Vendor dispute view: vendorId strictly from requireVendorAccess */
export async function getVendorTickets(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const rows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.vendorId, access.vendorId))
    .orderBy(desc(supportTickets.createdAt));
  return rows.map(withoutAdminNotes);
}

/** Admin console view for tickets */
export async function getAdminTickets(opts?: {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const db = getDb();

  const page = Math.max(1, opts?.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts?.limit ?? 25));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts?.status) conditions.push(eq(supportTickets.status, opts.status));
  if (opts?.category) conditions.push(eq(supportTickets.category, opts.category));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [countRes, rows] = await Promise.all([
    db.select({ count: count() }).from(supportTickets).where(whereClause),
    db
      .select()
      .from(supportTickets)
      .where(whereClause)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    tickets: rows,
    total,
    totalPages,
    page,
    limit,
  };
}
