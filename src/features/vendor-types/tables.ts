import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/db";
import {
  dairyFarms,
  dairyItems,
  fitnessPackages,
  fitnessTrainers,
  giftItems,
  giftStudios,
  kidsProviderProfiles,
  mehndiArtists,
  mehndiPackages,
  physioClinics,
  physioTreatments,
  retailStores,
  tiffinKitchens,
  tiffinMeals,
  waterCans,
  waterSuppliers,
  kidsAcademicsProfiles,
  kidsAcademicsItems,
  kidsStemProfiles,
  kidsStemItems,
  kidsPerformingArtsProfiles,
  kidsPerformingArtsItems,
  kidsArtsCraftsProfiles,
  kidsArtsCraftsItems,
  kidsSchoolProjectsProfiles,
  kidsSchoolProjectsItems,
  kidsCampsProfiles,
  kidsCampsItems,
  kidsSportsFitnessProfiles,
  kidsSportsFitnessItems,
  kidsLifeSkillsProfiles,
  kidsLifeSkillsItems,
  kidsProductsProfiles,
  kidsProductsItems,
  kidsInstitutionsProfiles,
  kidsInstitutionsItems,
} from "@/db/schema";
import type { VendorType } from "@/core/vendor-types";

// No "server-only" here: seed scripts reuse these helpers.
type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;
type Row = Record<string, unknown>;

/** The profile table for each vendor type. All share a vendor_id primary key. */
const PROFILE = {
  tiffin: tiffinKitchens,
  water: waterSuppliers,
  milk: dairyFarms,
  gifts: giftStudios,
  store: retailStores,
  fitness: fitnessTrainers,
  physio: physioClinics,
  mehndi: mehndiArtists,
  kids: kidsProviderProfiles,
  kids_academics: kidsAcademicsProfiles,
  kids_stem: kidsStemProfiles,
  kids_performing_arts: kidsPerformingArtsProfiles,
  kids_arts_crafts: kidsArtsCraftsProfiles,
  kids_school_projects: kidsSchoolProjectsProfiles,
  kids_camps: kidsCampsProfiles,
  kids_sports_fitness: kidsSportsFitnessProfiles,
  kids_life_skills: kidsLifeSkillsProfiles,
  kids_products: kidsProductsProfiles,
  kids_institutions: kidsInstitutionsProfiles,
} as const;

/** Item tables keyed by product id (delivery) or service id (booking). */
const PRODUCT_ITEMS = {
  tiffin: tiffinMeals,
  water: waterCans,
  milk: dairyItems,
  gifts: giftItems,
  kids_products: kidsProductsItems,
} as const;

const SERVICE_ITEMS = {
  fitness: fitnessPackages,
  physio: physioTreatments,
  mehndi: mehndiPackages,
  kids_academics: kidsAcademicsItems,
  kids_stem: kidsStemItems,
  kids_performing_arts: kidsPerformingArtsItems,
  kids_arts_crafts: kidsArtsCraftsItems,
  kids_school_projects: kidsSchoolProjectsItems,
  kids_camps: kidsCampsItems,
  kids_sports_fitness: kidsSportsFitnessItems,
  kids_life_skills: kidsLifeSkillsItems,
  kids_institutions: kidsInstitutionsItems,
} as const;

/** Creates the empty profile row a new vendor of this type needs. Safe to call twice. */
export async function provisionTypeProfile(db: Executor, vendorId: string, type: VendorType) {
  const table = PROFILE[type];
  await db.insert(table).values({ vendorId }).onConflictDoNothing();
}

export async function readTypeProfile(db: Executor, vendorId: string, type: VendorType): Promise<Row | null> {
  const table = PROFILE[type];
  const [row] = await db.select().from(table).where(eq(table.vendorId, vendorId)).limit(1);
  return (row as Row | undefined) ?? null;
}

export async function writeTypeProfile(db: Executor, vendorId: string, type: VendorType, values: Row) {
  const table = PROFILE[type];
  const set = { ...values, updatedAt: new Date() };
  await db
    .insert(table)
    .values({ vendorId, ...set } as typeof table.$inferInsert)
    .onConflictDoUpdate({ target: table.vendorId, set: set as Partial<typeof table.$inferInsert> });
}

export function hasItemTable(type: VendorType): boolean {
  return type in PRODUCT_ITEMS || type in SERVICE_ITEMS;
}

/** Details for many items of one vendor, keyed by product / service id. */
export async function readItemDetails(db: Executor, vendorId: string, type: VendorType, ids: string[]): Promise<Map<string, Row>> {
  const out = new Map<string, Row>();
  if (ids.length === 0) return out;
  if (type in PRODUCT_ITEMS) {
    const table = PRODUCT_ITEMS[type as keyof typeof PRODUCT_ITEMS];
    const rows = await db.select().from(table).where(and(eq(table.vendorId, vendorId), inArray(table.productId, ids)));
    for (const r of rows) out.set(r.productId, r as Row);
  } else if (type in SERVICE_ITEMS) {
    const table = SERVICE_ITEMS[type as keyof typeof SERVICE_ITEMS];
    const rows = await db.select().from(table).where(and(eq(table.vendorId, vendorId), inArray(table.serviceId, ids)));
    for (const r of rows) out.set(r.serviceId, r as Row);
  }
  return out;
}

/** Creates an item's detail row with the table defaults. Safe to call twice. */
export async function provisionItemDetails(db: Executor, vendorId: string, type: VendorType, itemId: string) {
  if (type in PRODUCT_ITEMS) {
    const table = PRODUCT_ITEMS[type as keyof typeof PRODUCT_ITEMS];
    await db.insert(table).values({ productId: itemId, vendorId }).onConflictDoNothing();
  } else if (type in SERVICE_ITEMS) {
    const table = SERVICE_ITEMS[type as keyof typeof SERVICE_ITEMS];
    await db.insert(table).values({ serviceId: itemId, vendorId }).onConflictDoNothing();
  }
}

/** Upserts one item's details. The composite FK makes a foreign item id fail. */
export async function writeItemDetails(db: Executor, vendorId: string, type: VendorType, itemId: string, values: Row) {
  const set = { ...values, updatedAt: new Date() };
  if (type in PRODUCT_ITEMS) {
    const table = PRODUCT_ITEMS[type as keyof typeof PRODUCT_ITEMS];
    await db
      .insert(table)
      .values({ productId: itemId, vendorId, ...set } as typeof table.$inferInsert)
      .onConflictDoUpdate({ target: table.productId, set: set as Partial<typeof table.$inferInsert> });
  } else if (type in SERVICE_ITEMS) {
    const table = SERVICE_ITEMS[type as keyof typeof SERVICE_ITEMS];
    await db
      .insert(table)
      .values({ serviceId: itemId, vendorId, ...set } as typeof table.$inferInsert)
      .onConflictDoUpdate({ target: table.serviceId, set: set as Partial<typeof table.$inferInsert> });
  }
}
