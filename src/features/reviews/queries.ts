import "server-only";
import { and, count, desc, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, customers, shopOrders, subscriptions, vendorReviews, vendors } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { requireAdmin, requireVendorAccess } from "@/lib/auth/session";
import { canReview } from "@/core/ratings";
import { todayIST } from "@/core/time";

/** "Priya S." — households are shown by first name and initial only. */
export function publicName(full: string): string {
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? "Customer";
  const last = parts.length > 1 ? ` ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.` : "";
  return first + last;
}

export async function getStoreReviews(vendorId: string, limit = 20) {
  const db = getDb();
  const rows = await db
    .select({ review: vendorReviews, name: customers.name })
    .from(vendorReviews)
    .innerJoin(customers, eq(vendorReviews.customerId, customers.id))
    .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.isHidden, false)))
    .orderBy(desc(vendorReviews.updatedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.review, author: publicName(r.name) }));
}

/** Whether the signed-in household may review this store, and its current review. */
export async function getMyReviewState(vendorId: string) {
  const user = await hexclave.getUser();
  if (!user) return { eligible: false, mine: null };
  const db = getDb();
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.vendorId, vendorId), eq(customers.userId, user.id)))
    .limit(1);
  if (!customer) return { eligible: false, mine: null };

  const [[delivered], [started], [sessions], [mine]] = await Promise.all([
    db.select({ n: count() }).from(shopOrders).where(and(eq(shopOrders.customerId, customer.id), eq(shopOrders.status, "delivered"))),
    db.select({ n: count() }).from(subscriptions).where(and(eq(subscriptions.customerId, customer.id), lte(subscriptions.startsOn, todayIST()))),
    db.select({ n: count() }).from(bookings).where(and(eq(bookings.customerId, customer.id), inArray(bookings.status, ["done", "no_show"]))),
    db.select().from(vendorReviews).where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.userId, user.id))).limit(1),
  ]);
  return {
    eligible: canReview({ deliveredOrders: delivered?.n ?? 0, startedPlans: started?.n ?? 0, completedSessions: sessions?.n ?? 0 }),
    mine: mine ?? null,
  };
}

export async function getVendorPanelReviews(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const rows = await db
    .select({ review: vendorReviews, name: customers.name })
    .from(vendorReviews)
    .innerJoin(customers, eq(vendorReviews.customerId, customers.id))
    .where(eq(vendorReviews.vendorId, access.vendorId))
    .orderBy(desc(vendorReviews.updatedAt))
    .limit(200);
  return rows.map((r) => ({ ...r.review, author: publicName(r.name) }));
}

export async function getAdminVendorReviews(vendorId: string) {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select({ review: vendorReviews, name: customers.name, vendorName: vendors.name })
    .from(vendorReviews)
    .innerJoin(customers, eq(vendorReviews.customerId, customers.id))
    .innerJoin(vendors, eq(vendorReviews.vendorId, vendors.id))
    .where(eq(vendorReviews.vendorId, vendorId))
    .orderBy(desc(vendorReviews.updatedAt))
    .limit(200);
  return rows.map((r) => ({ ...r.review, author: r.name }));
}
