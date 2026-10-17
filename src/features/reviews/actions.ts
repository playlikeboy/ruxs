"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, customers, vendorReviews, vendors } from "@/db/schema";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { hideSchema, replySchema, saveReviewSchema } from "./schemas";

function fail(error: string) {
  return { ok: false as const, error };
}

/** Create or update my review of any store. One per person per store. */
export async function saveMyReview(input: unknown) {
  const parsed = saveReviewSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid review");

  const user = await requireUser();
  const db = getDb();
  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.slug, parsed.data.vendorSlug), eq(vendors.status, "active")))
    .limit(1);
  if (!vendor) return fail("Store not found");

  const [[profile], [customer]] = await Promise.all([
    db.select({ name: consumers.name }).from(consumers).where(eq(consumers.userId, user.id)).limit(1),
    db.select({ id: customers.id }).from(customers).where(and(eq(customers.vendorId, vendor.id), eq(customers.userId, user.id))).limit(1),
  ]);
  // Never fall back to the email address: reviews are public.
  const authorName = (profile?.name || user.displayName || "RUXs user").slice(0, 80);

  const values = { rating: parsed.data.rating, comment: parsed.data.comment || null, authorName, updatedAt: new Date() };
  await db
    .insert(vendorReviews)
    .values({ vendorId: vendor.id, customerId: customer?.id ?? null, userId: user.id, ...values })
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
