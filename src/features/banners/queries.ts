import "server-only";
import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { homeBanners } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

/** Live slides for the household home screen. A missing table (migration not run yet) shows none. */
export async function getHomeBanners() {
  const now = new Date();
  try {
    return await getDb()
      .select()
      .from(homeBanners)
      .where(
        and(
          eq(homeBanners.isActive, true),
          or(isNull(homeBanners.startsAt), lte(homeBanners.startsAt, now)),
          or(isNull(homeBanners.endsAt), gt(homeBanners.endsAt, now))
        )
      )
      .orderBy(asc(homeBanners.sort), asc(homeBanners.createdAt));
  } catch (err) {
    console.error("getHomeBanners failed", err);
    return [];
  }
}

export async function getAllBanners() {
  await requireAdmin();
  return getDb().select().from(homeBanners).orderBy(asc(homeBanners.sort), asc(homeBanners.createdAt));
}
