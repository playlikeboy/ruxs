import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorReviews } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { requireAdmin, requireVendorAccess } from "@/lib/auth/session";

/** "Priya S." — reviewers are shown by first name and initial only. */
export function publicName(full: string): string {
  const parts = full.trim().split(/\s+/);
  const first = parts[0] || "RUXs";
  const last = parts.length > 1 ? ` ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.` : "";
  return first + last;
}

export async function getStoreReviews(vendorId: string, limit = 20) {
  const db = getDb();
  const rows = await db
    .select()
    .from(vendorReviews)
    .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.isHidden, false)))
    .orderBy(desc(vendorReviews.updatedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, author: publicName(r.authorName) }));
}

/** Any signed-in person may rate any store; returns their current review, if any. */
export async function getMyReviewState(vendorId: string) {
  const user = await hexclave.getUser();
  if (!user) return { eligible: false, mine: null };
  const db = getDb();
  const [mine] = await db
    .select()
    .from(vendorReviews)
    .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.userId, user.id)))
    .limit(1);
  return { eligible: true, mine: mine ?? null };
}

export async function getVendorPanelReviews(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const rows = await db.select().from(vendorReviews).where(eq(vendorReviews.vendorId, access.vendorId)).orderBy(desc(vendorReviews.updatedAt)).limit(200);
  return rows.map((r) => ({ ...r, author: publicName(r.authorName) }));
}

export async function getAdminVendorReviews(vendorId: string) {
  await requireAdmin();
  const db = getDb();
  const rows = await db.select().from(vendorReviews).where(eq(vendorReviews.vendorId, vendorId)).orderBy(desc(vendorReviews.updatedAt)).limit(200);
  return rows.map((r) => ({ ...r, author: r.authorName }));
}
