import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";
import { categories } from "./platform";

/** A provider's weekly free hours, in IST wall-clock time. */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    weekday: text("weekday").notNull(), // mon..sun
    startTime: text("start_time").notNull(), // "06:00"
    endTime: text("end_time").notNull(), // "10:00"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("availability_rules_vendor_idx").on(t.vendorId, t.weekday),
    check("availability_rules_weekday_check", sql`${t.weekday} in ('mon','tue','wed','thu','fri','sat','sun')`),
  ]
);

/** Time off: holidays, leave, a blocked afternoon. */
export const availabilityBlocks = pgTable(
  "availability_blocks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("availability_blocks_vendor_idx").on(t.vendorId, t.startsAt)]
);

/** Who a booking provider is: shown on their profile page. Delivery stores have none. */
export const providerProfiles = pgTable(
  "provider_profiles",
  {
    vendorId: text("vendor_id")
      .primaryKey()
      .references(() => vendors.id, { onDelete: "cascade" }),
    headline: text("headline"), // "Certified personal trainer · weight loss"
    qualifications: text("qualifications"), // "BPT, MPT (Ortho)"
    experienceYears: integer("experience_years"),
    specialities: text("specialities").array().notNull().default(sql`'{}'::text[]`),
    languages: text("languages").array().notNull().default(sql`'{}'::text[]`),
    gender: text("gender"), // female, male, other
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check("provider_profiles_gender_check", sql`${t.gender} is null or ${t.gender} in ('female', 'male', 'other')`)]
);

/** What a booking provider offers: a timed session at a price. Delivery stores use products instead. */
export const services = pgTable(
  "services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onUpdate: "cascade", onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    durationMinutes: integer("duration_minutes").notNull(),
    pricePaise: integer("price_paise").notNull(),
    modes: text("modes").array().notNull().default(sql`'{home}'::text[]`), // home, studio, online
    isActive: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }), // soft delete: bookings keep their service
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("services_vendor_idx").on(t.vendorId),
    uniqueIndex("services_id_vendor_idx").on(t.id, t.vendorId),
    check("services_duration_check", sql`${t.durationMinutes} between 15 and 480`),
    check("services_price_check", sql`${t.pricePaise} >= 0`),
  ]
);

/** A booked session with a trainer, physiotherapist or any booking provider. Standalone: not an order. */
export const bookings = pgTable(
  "bookings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull().unique(), // BK-1019-4K7Q
    clientKey: text("client_key").notNull().unique(), // idempotency for double taps
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    serviceId: text("service_id").references(() => services.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    mode: text("mode").notNull(), // home, studio, online
    address: text("address"),
    pricePaise: integer("price_paise").notNull(), // snapshot at booking
    paymentMode: text("payment_mode").notNull(), // online, pay_at_session
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid, refund_due, refunded
    notes: text("notes"),
    status: text("status").notNull().default("confirmed"), // held, confirmed, done, no_show, cancelled
    heldUntil: timestamp("held_until", { withTimezone: true }), // unpaid online bookings release the slot after this
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("bookings_vendor_time_idx").on(t.vendorId, t.startsAt),
    index("bookings_user_idx").on(t.userId, t.startsAt),
    uniqueIndex("bookings_vendor_start_active_idx").on(t.vendorId, t.startsAt).where(sql`${t.status} in ('held', 'confirmed')`),
    check("bookings_mode_check", sql`${t.mode} in ('home', 'studio', 'online')`),
    check("bookings_status_check", sql`${t.status} in ('held', 'confirmed', 'done', 'no_show', 'cancelled')`),
    check("bookings_payment_mode_check", sql`${t.paymentMode} in ('online', 'pay_at_session')`),
    check("bookings_payment_status_check", sql`${t.paymentStatus} in ('unpaid', 'paid', 'refund_due', 'refunded')`),
  ]
);
