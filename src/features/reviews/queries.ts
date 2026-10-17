import "server-only";
import { and, count, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers, vendorReviews, vendors } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { isUserAdmin, requireAdmin, requireVendorAccess } from "@/lib/auth/session";
import { calculatePagination } from "@/core/pagination";

/** "Priya S." — reviewers are shown by first name and initial only. */
export function publicName(full: string): string {
  const parts = full.trim().split(/\s+/);
  const first = parts[0] || "RUXs";
  const last = parts.length > 1 ? ` ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.` : "";
  return first + last;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  repliedAt: Date | null;
  updatedAt: Date;
}

export interface ReviewPageResult {
  reviews: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getStoreReviewsPaginated(
  vendorId: string,
  page = 1,
  pageSize = 10
): Promise<ReviewPageResult> {
  const db = getDb();
  const [countResult] = await db
    .select({ count: count() })
    .from(vendorReviews)
    .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.isHidden, false)));

  const total = Number(countResult?.count ?? 0);
  const pagination = calculatePagination(total, { page, pageSize, defaultPageSize: 10, maxPageSize: 50 });

  const rows = await db
    .select()
    .from(vendorReviews)
    .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.isHidden, false)))
    .orderBy(desc(vendorReviews.updatedAt))
    .limit(pagination.pageSize)
    .offset(pagination.offset);

  const reviews: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    author: publicName(r.authorName),
    rating: r.rating,
    comment: r.comment,
    reply: r.reply,
    repliedAt: r.repliedAt,
    updatedAt: r.updatedAt,
  }));

  return {
    reviews,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    hasMore: pagination.hasMore,
  };
}

export async function getStoreReviews(vendorId: string, limit = 20) {
  const res = await getStoreReviewsPaginated(vendorId, 1, limit);
  return res.reviews;
}

/** Check if current user is owner/staff of the vendor or a platform admin. */
export async function canReplyToStoreReviews(slug: string): Promise<boolean> {
  const user = await hexclave.getUser();
  if (!user) return false;
  if (await isUserAdmin(user)) return true;
  const db = getDb();
  const [row] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .innerJoin(
      vendorMembers,
      and(
        eq(vendorMembers.vendorId, vendors.id),
        eq(vendorMembers.userId, user.id),
        or(eq(vendorMembers.role, "owner"), eq(vendorMembers.role, "staff"))
      )
    )
    .where(eq(vendors.slug, slug))
    .limit(1);
  return !!row;
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
