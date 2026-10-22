import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { products } from "./catalog";
import { services } from "./bookings";

/*
 * One table per vendor type. Profile tables are 1:1 with vendors; item tables are
 * 1:1 with products (delivery types) or services (booking types). Database
 * triggers (migration 0013) reject rows for a vendor of another type, so a tiffin
 * kitchen can only ever have tiffin rows. Kids academies use kids_provider_profiles
 * and kids_services (see kids.ts).
 */

const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
const vendorPk = () =>
  text("vendor_id")
    .primaryKey()
    .references(() => vendors.id, { onDelete: "cascade" });
const vendorRef = () =>
  text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" });
const emptyArray = sql`'{}'::text[]`;

// ── Profiles ────────────────────────────────────────────────────────────────

export const tiffinKitchens = pgTable("tiffin_kitchens", {
  vendorId: vendorPk(),
  diet: text("diet").notNull().default("veg"), // veg, jain, egg, non_veg, mixed
  cuisines: text("cuisines").array().notNull().default(emptyArray),
  mealSlots: text("meal_slots").array().notNull().default(sql`'{lunch,dinner}'::text[]`),
  weeklyOff: text("weekly_off").array().notNull().default(emptyArray), // mon..sun
  trialMealPaise: integer("trial_meal_paise"),
  dabbaType: text("dabba_type").notNull().default("steel"), // steel, disposable, eco
  fssaiNumber: text("fssai_number"),
  updatedAt: updatedAt(),
});

export const waterSuppliers = pgTable("water_suppliers", {
  vendorId: vendorPk(),
  waterSource: text("water_source").notNull().default("ro"), // ro, mineral, spring, alkaline
  brands: text("brands").array().notNull().default(emptyArray),
  tdsPpm: integer("tds_ppm"),
  bisLicense: text("bis_license"),
  upperFloorDelivery: boolean("upper_floor_delivery").notNull().default(true),
  sameDayDelivery: boolean("same_day_delivery").notNull().default(true),
  updatedAt: updatedAt(),
});

export const dairyFarms = pgTable("dairy_farms", {
  vendorId: vendorPk(),
  source: text("source").notNull().default("own_farm"), // own_farm, cooperative, brand, collection_centre
  animals: text("animals").array().notNull().default(sql`'{cow}'::text[]`),
  packaging: text("packaging").notNull().default("pouch"), // pouch, glass_bottle, can, loose
  morningDeliveryBy: text("morning_delivery_by").notNull().default("07:00"),
  eveningDelivery: boolean("evening_delivery").notNull().default(false),
  fssaiNumber: text("fssai_number"),
  updatedAt: updatedAt(),
});

export const giftStudios = pgTable("gift_studios", {
  vendorId: vendorPk(),
  occasions: text("occasions").array().notNull().default(emptyArray),
  customisation: boolean("customisation").notNull().default(true),
  minLeadDays: integer("min_lead_days").notNull().default(1),
  giftWrapPaise: integer("gift_wrap_paise").notNull().default(0),
  shipsOutsideCity: boolean("ships_outside_city").notNull().default(false),
  updatedAt: updatedAt(),
});

export const retailStores = pgTable("retail_stores", {
  vendorId: vendorPk(),
  storeKind: text("store_kind").notNull().default("general"), // general, grocery, stationery, kids_kits, pharmacy, other
  gstin: text("gstin"),
  opensAt: text("opens_at"), // "08:00"
  closesAt: text("closes_at"),
  updatedAt: updatedAt(),
});

export const fitnessTrainers = pgTable("fitness_trainers", {
  vendorId: vendorPk(),
  headline: text("headline"),
  certifications: text("certifications"),
  experienceYears: integer("experience_years"),
  specialities: text("specialities").array().notNull().default(emptyArray),
  languages: text("languages").array().notNull().default(emptyArray),
  gender: text("gender"),
  gymName: text("gym_name"),
  gymAddress: text("gym_address"),
  womenOnlySlots: boolean("women_only_slots").notNull().default(false),
  updatedAt: updatedAt(),
});

export const physioClinics = pgTable("physio_clinics", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  registrationNumber: text("registration_number"), // state council / IAP number
  experienceYears: integer("experience_years"),
  specialities: text("specialities").array().notNull().default(emptyArray),
  conditionsTreated: text("conditions_treated").array().notNull().default(emptyArray),
  languages: text("languages").array().notNull().default(emptyArray),
  gender: text("gender"),
  clinicName: text("clinic_name"),
  clinicAddress: text("clinic_address"),
  homeVisits: boolean("home_visits").notNull().default(true),
  homeVisitFeePaise: integer("home_visit_fee_paise").notNull().default(0),
  updatedAt: updatedAt(),
});

export const mehndiArtists = pgTable("mehndi_artists", {
  vendorId: vendorPk(),
  headline: text("headline"),
  experienceYears: integer("experience_years"),
  styles: text("styles").array().notNull().default(emptyArray),
  languages: text("languages").array().notNull().default(emptyArray),
  gender: text("gender"),
  organicHenna: boolean("organic_henna").notNull().default(true),
  teamSize: integer("team_size").notNull().default(1),
  travelFeePaise: integer("travel_fee_paise").notNull().default(0),
  bridalAdvanceDays: integer("bridal_advance_days").notNull().default(7),
  portfolioUrl: text("portfolio_url"),
  updatedAt: updatedAt(),
});

// ── Items ───────────────────────────────────────────────────────────────────

export const tiffinMeals = pgTable(
  "tiffin_meals",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    mealType: text("meal_type").notNull().default("lunch"), // breakfast, lunch, dinner, snacks
    diet: text("diet").notNull().default("veg"), // veg, jain, egg, non_veg
    cuisine: text("cuisine"),
    itemsIncluded: text("items_included"), // "4 roti, dal, sabzi, rice, salad"
    spiceLevel: text("spice_level").notNull().default("medium"), // mild, medium, spicy
    calories: integer("calories"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("tiffin_meals_vendor_idx").on(t.vendorId),
  ]
);

export const waterCans = pgTable(
  "water_cans",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    volumeMl: integer("volume_ml").notNull().default(20000),
    packSize: integer("pack_size").notNull().default(1),
    container: text("container").notNull().default("can"), // can, jar, bottle_pack, dispenser
    returnable: boolean("returnable").notNull().default(false),
    chilled: boolean("chilled").notNull().default(false),
    brand: text("brand"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("water_cans_vendor_idx").on(t.vendorId),
  ]
);

export const dairyItems = pgTable(
  "dairy_items",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    itemType: text("item_type").notNull().default("milk"), // milk, curd, paneer, ghee, butter, buttermilk, other
    animal: text("animal"), // cow, buffalo, a2_cow, goat, mixed
    quantity: integer("quantity"),
    unit: text("unit").notNull().default("ml"), // ml, l, g, kg, pcs
    fatPercentX10: integer("fat_percent_x10"), // 4.5% = 45
    packaging: text("packaging").notNull().default("pouch"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("dairy_items_vendor_idx").on(t.vendorId),
  ]
);

export const giftItems = pgTable(
  "gift_items",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    occasion: text("occasion"),
    customisable: boolean("customisable").notNull().default(false),
    personalisationHint: text("personalisation_hint"), // "Name and date, up to 20 letters"
    leadDays: integer("lead_days").notNull().default(1),
    giftWrap: boolean("gift_wrap").notNull().default(true),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("gift_items_vendor_idx").on(t.vendorId),
  ]
);

export const fitnessPackages = pgTable(
  "fitness_packages",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    packageType: text("package_type").notNull().default("single"), // trial, single, pack, monthly
    sessionsIncluded: integer("sessions_included").notNull().default(1),
    validityDays: integer("validity_days"),
    level: text("level").notNull().default("all"), // beginner, intermediate, advanced, all
    focus: text("focus"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("fitness_packages_vendor_idx").on(t.vendorId),
  ]
);

export const physioTreatments = pgTable(
  "physio_treatments",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    treatmentType: text("treatment_type").notNull().default("session"), // assessment, session, package, consultation
    conditions: text("conditions").array().notNull().default(emptyArray),
    sessionsIncluded: integer("sessions_included").notNull().default(1),
    equipment: text("equipment"),
    requiresPrescription: boolean("requires_prescription").notNull().default(false),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("physio_treatments_vendor_idx").on(t.vendorId),
  ]
);

export const mehndiPackages = pgTable(
  "mehndi_packages",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    style: text("style").notNull().default("arabic"), // bridal, arabic, rajasthani, indo_western, minimal, kids, other
    coverage: text("coverage").notNull().default("both_hands"), // per_hand, both_hands, hands_and_feet, full_bridal
    peopleIncluded: integer("people_included").notNull().default(1),
    organic: boolean("organic").notNull().default(true),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("mehndi_packages_vendor_idx").on(t.vendorId),
  ]
);
