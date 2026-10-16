import "server-only";
import { cache } from "react";
import { asc, count, eq, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, localities, platformSettings, vendorReviews } from "@/db/schema";
import { summaryFromTotals, type RatingSummary } from "@/core/ratings";
import type { LocalityCentroid } from "@/core/geo";

export type Category = typeof categories.$inferSelect;

/** Active categories in display order. Per request, so admin edits show at once. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const db = getDb();
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sort), asc(categories.label));
});

export const getAllCategories = cache(async (): Promise<Category[]> => {
  const db = getDb();
  return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.label));
});

/** Lookup that never fails: unknown ids get a neutral placeholder. */
export const getCategoryMap = cache(async () => {
  const all = await getAllCategories();
  const map = new Map(all.map((c) => [c.id, c]));
  return (id: string): Category =>
    map.get(id) ?? {
      id,
      label: id,
      shortLabel: id,
      emoji: "🛍️",
      blurb: "",
      tint: "#F4F4F5",
      coverFrom: "#F4F4F5",
      coverTo: "#FFFFFF",
      sort: 999,
      isActive: false,
      createdAt: new Date(0),
    };
});

export const getLocalities = cache(async (): Promise<LocalityCentroid[]> => {
  const db = getDb();
  return db
    .select({
      id: localities.id,
      name: localities.name,
      city: localities.city,
      state: localities.state,
      latitude: localities.latitude,
      longitude: localities.longitude,
    })
    .from(localities)
    .where(eq(localities.isActive, true));
});

/** Platform knobs (single row). Falls back to safe defaults if the row is missing. */
export const getPlatformSettings = cache(async () => {
  const db = getDb();
  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1);
  return { discoveryRadiusKm: row?.discoveryRadiusKm ?? 10 };
});

/** Average rating and count per vendor, hidden reviews excluded. */
export const getRatingMap = cache(async () => {
  const db = getDb();
  const rows = await db
    .select({ vendorId: vendorReviews.vendorId, total: sum(vendorReviews.rating), n: count() })
    .from(vendorReviews)
    .where(eq(vendorReviews.isHidden, false))
    .groupBy(vendorReviews.vendorId);
  const map = new Map(rows.map((r) => [r.vendorId, summaryFromTotals(Number(r.total ?? 0), r.n)]));
  return (vendorId: string): RatingSummary => map.get(vendorId) ?? { average: null, count: 0 };
});
