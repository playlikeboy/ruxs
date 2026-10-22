import "server-only";
import { cache } from "react";
import { asc, count, eq, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, localities, platformSettings, vendorReviews } from "@/db/schema";
import { summaryFromTotals, type RatingSummary } from "@/core/ratings";
import type { LocalityCentroid } from "@/core/geo";

export type Category = typeof categories.$inferSelect;

export const DEFAULT_KIDS_CATEGORIES: Category[] = [
  {
    id: "kids_academics",
    label: "Home Tutors & Academics",
    shortLabel: "Tutors",
    emoji: "📚",
    blurb: "Home tutors for Nursery–Class 5, phonics, maths, homework assistance",
    tint: "#EDE3FF",
    coverFrom: "#EDE3FF",
    coverTo: "#FFFFFF",
    sort: 20,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_academics",
    createdAt: new Date(0),
  },
  {
    id: "kids_stem",
    label: "Science, STEM & Coding",
    shortLabel: "STEM",
    emoji: "🤖",
    blurb: "Robotics, Scratch & Python coding, DIY experiments, electronics",
    tint: "#D9F4FF",
    coverFrom: "#D9F4FF",
    coverTo: "#FFFFFF",
    sort: 21,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_stem",
    createdAt: new Date(0),
  },
  {
    id: "kids_performing_arts",
    label: "Dance, Music & Performing Arts",
    shortLabel: "Dance & Music",
    emoji: "💃",
    blurb: "Bollywood, classical, folk dance, singing & musical instruments",
    tint: "#FFE1EF",
    coverFrom: "#FFE1EF",
    coverTo: "#FFFFFF",
    sort: 22,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_performing_arts",
    createdAt: new Date(0),
  },
  {
    id: "kids_arts_crafts",
    label: "Art, Craft & Creative",
    shortLabel: "Art & Craft",
    emoji: "🎨",
    blurb: "Drawing, painting, clay modelling, pottery, origami, calligraphy",
    tint: "#FFF3C4",
    coverFrom: "#FFF3C4",
    coverTo: "#FFFFFF",
    sort: 23,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_arts_crafts",
    createdAt: new Date(0),
  },
  {
    id: "kids_school_projects",
    label: "School Projects & Models",
    shortLabel: "Projects",
    emoji: "📐",
    blurb: "Science working models, scrapbooks, dioramas, competition prep",
    tint: "#FFE6D5",
    coverFrom: "#FFE6D5",
    coverTo: "#FFFFFF",
    sort: 24,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_school_projects",
    createdAt: new Date(0),
  },
  {
    id: "kids_camps",
    label: "Holiday Camps & Clubs",
    shortLabel: "Camps",
    emoji: "🏕️",
    blurb: "Summer & winter bootcamps, workshops, multi-activity clubs",
    tint: "#DDF8EA",
    coverFrom: "#DDF8EA",
    coverTo: "#FFFFFF",
    sort: 25,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_camps",
    createdAt: new Date(0),
  },
  {
    id: "kids_sports_fitness",
    label: "Kids Yoga, Chess & Sports",
    shortLabel: "Chess & Sports",
    emoji: "♟️",
    blurb: "FIDE chess coaching, yoga, gymnastics, skating, puzzle-solving",
    tint: "#E3ECFF",
    coverFrom: "#E3ECFF",
    coverTo: "#FFFFFF",
    sort: 26,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_sports_fitness",
    createdAt: new Date(0),
  },
  {
    id: "kids_life_skills",
    label: "Life Skills & Hobbies",
    shortLabel: "Life Skills",
    emoji: "🍳",
    blurb: "No-fire cooking, dining etiquette, magic tricks, gardening",
    tint: "#FFF8EC",
    coverFrom: "#FFF8EC",
    coverTo: "#FFFFFF",
    sort: 27,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_life_skills",
    createdAt: new Date(0),
  },
  {
    id: "kids_products",
    label: "Kids Kits & Materials",
    shortLabel: "DIY Kits",
    emoji: "🧩",
    blurb: "Science experiment boxes, art supplies, robotics kits, educational toys",
    tint: "#FEF08A",
    coverFrom: "#FEF08A",
    coverTo: "#FFFFFF",
    sort: 28,
    isActive: true,
    fulfilment: "delivery",
    vendorType: "kids_products",
    createdAt: new Date(0),
  },
  {
    id: "kids_institutions",
    label: "Preschools & Learning Centres",
    shortLabel: "Institutions",
    emoji: "🏫",
    blurb: "Preschools, daycares, activity academies, indoor play centres",
    tint: "#F4F4F5",
    coverFrom: "#F4F4F5",
    coverTo: "#FFFFFF",
    sort: 29,
    isActive: true,
    fulfilment: "booking",
    vendorType: "kids_institutions",
    createdAt: new Date(0),
  },
];

function mergeDefaultCategories(dbRows: Category[]): Category[] {
  const existingIds = new Set(dbRows.map((r) => r.id));
  const missing = DEFAULT_KIDS_CATEGORIES.filter((d) => !existingIds.has(d.id));
  return [...dbRows, ...missing].sort((a, b) => a.sort - b.sort);
}

/** Active categories in display order. Per request, so admin edits show at once. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const db = getDb();
  try {
    const rows = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sort), asc(categories.label));
    return mergeDefaultCategories(rows);
  } catch {
    return DEFAULT_KIDS_CATEGORIES;
  }
});

export const getAllCategories = cache(async (): Promise<Category[]> => {
  const db = getDb();
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sort), asc(categories.label));
    return mergeDefaultCategories(rows);
  } catch {
    return DEFAULT_KIDS_CATEGORIES;
  }
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
      fulfilment: "delivery",
      vendorType: "store",
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
