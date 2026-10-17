"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, customers, shopOrders, subscriptions, vendorReviews, vendors } from "@/db/schema";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { canReview } from "@/core/ratings";
import { todayIST } from "@/core/time";
import { hideSchema, replySchema, saveReviewSchema } from "./schemas";

function fail(error: string) {
  return { ok: false as const, error };
}

/** Create or update my review of a store. Only real customers of that store may review. */
export async function saveMyReview(input: unknown) {
  const parsed = saveReviewSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid review");

  const user = await requireUser();
  const db = getDb();
  const [row] = await db
    .select({ vendorId: vendors.id, customerId: customers.id })
    .from(vendors)
    .innerJoin(customers, and(eq(customers.vendorId, vendors.id), eq(customers.userId, user.id)))
    .where(eq(vendors.slug, parsed.data.vendorSlug))
    .limit(1);
  if (!row) return fail("Order from this store first, then rate it");

  const [[delivered], [started], [sessions]] = await Promise.all([
    db.select({ n: count() }).from(shopOrders).where(and(eq(shopOrders.customerId, row.customerId), eq(shopOrders.status, "delivered"))),
    db.select({ n: count() }).from(subscriptions).where(and(eq(subscriptions.customerId, row.customerId), lte(subscriptions.startsOn, todayIST()))),
    db.select({ n: count() }).from(bookings).where(and(eq(bookings.customerId, row.customerId), inArray(bookings.status, ["done", "no_show"]))),
  ]);
  if (!canReview({ deliveredOrders: delivered?.n ?? 0, startedPlans: started?.n ?? 0, completedSessions: sessions?.n ?? 0 })) {
    return fail("You can rate after your first delivery or completed session");
  }

  const values = { rating: parsed.data.rating, comment: parsed.data.comment || null, updatedAt: new Date() };
  await db
    .insert(vendorReviews)
    .values({ vendorId: row.vendorId, customerId: row.customerId, userId: user.id, ...values })
    .onConflictDoUpdate({ target: [vendorReviews.vendorId, vendorReviews.userId], set: values });

  revalidatePath(`/app/store/${parsed.data.vendorSlug}`);
  revalidatePath("/app", "layout");
  return { ok: true as const };
}

/** The store's public reply under a review. Empty text removes the reply. */
export async function replyToReview(input: unknown) {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return fail("Invalid reply");
  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const db = getDb();
  const reply = parsed.data.reply || null;
  const [updated] = await db
    .update(vendorReviews)
    .set({ reply, repliedAt: reply ? new Date() : null })
    .where(and(eq(vendorReviews.id, parsed.data.reviewId), eq(vendorReviews.vendorId, access.vendorId)))
    .returning({ id: vendorReviews.id });
  if (!updated) return fail("Review not found");
  revalidatePath(`/merchant-panel/${parsed.data.slug}/reviews`);
  revalidatePath(`/app/store/${parsed.data.slug}`);
  return { ok: true as const };
}

/** Admin moderation: hidden reviews leave the public list and the average. */
export async function adminSetReviewHidden(input: unknown) {
  const parsed = hideSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  await requireAdmin();
  const db = getDb();
  const [updated] = await db
    .update(vendorReviews)
    .set({ isHidden: parsed.data.hidden })
    .where(eq(vendorReviews.id, parsed.data.reviewId))
    .returning({ vendorId: vendorReviews.vendorId });
  if (!updated) return fail("Review not found");
  revalidatePath(`/admin/vendors/${updated.vendorId}`);
  revalidatePath("/app", "layout");
  return { ok: true as const };
}
