import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";
import { products } from "./catalog";
import { shopOrders } from "./shop";

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

/**
 * A booked session with a trainer, physiotherapist or any booking provider.
 * Money and status flow through its shop order (payment, earnings, refunds).
 */
export const bookings = pgTable(
  "bookings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    shopOrderId: text("shop_order_id")
      .notNull()
      .unique()
      .references(() => shopOrders.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    mode: text("mode").notNull(), // home, studio, online
    address: text("address"),
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
  ]
);
