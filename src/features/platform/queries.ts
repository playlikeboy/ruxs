import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, localities } from "@/db/schema";
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
