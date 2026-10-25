import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";
import { shopOrders } from "./shop";

/** Service categories shown to households (tiffin, water, …). Managed in /admin. */
export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // slug, also products.kind
  label: text("label").notNull(),
  shortLabel: text("short_label").notNull(),
  emoji: text("emoji").notNull(),
  blurb: text("blurb").notNull().default(""),
  tint: text("tint").notNull().default("#F4F4F5"), // hex
  coverFrom: text("cover_from").notNull().default("#F4F4F5"),
  coverTo: text("cover_to").notNull().default("#FFFFFF"),
  sort: integer("sort").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  fulfilment: text("fulfilment").notNull().default("delivery"), // delivery (tiffin, water) or booking (trainers, physio)
  vendorType: text("vendor_type").notNull().default("store"), // which per-type tables its vendors use, see core/vendor-types
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Named neighbourhood centres, used to label GPS points and place vendors without a pin. */
export const localities = pgTable("localities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** People with full /admin access, by verified email or Hexclave user id. */
export const platformAdmins = pgTable("platform_admins", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  userId: text("user_id").unique(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Online payments collected by RUXs through Razorpay, on behalf of a vendor. */
export const payments = pgTable(
  "payments",
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
    purpose: text("purpose").notNull(), // shop_order, dues, booking
    shopOrderId: text("shop_order_id").references(() => shopOrders.id, { onDelete: "set null" }),
    bookingId: text("booking_id"), // FK to bookings (declared in SQL; kept loose here to avoid a schema import cycle)
    amountPaise: integer("amount_paise").notNull(),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    status: text("status").notNull().default("created"), // created, paid, failed
    failureReason: text("failure_reason"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("payments_vendor_status_idx").on(t.vendorId, t.status),
    index("payments_shop_order_idx").on(t.shopOrderId),
    check("payments_purpose_check", sql`${t.purpose} in ('shop_order', 'dues', 'booking')`),
    check("payments_status_check", sql`${t.status} in ('created', 'paid', 'failed')`),
    check("payments_amount_check", sql`${t.amountPaise} > 0`),
  ]
);

/** Money RUXs owes a vendor, withdrawn monthly. Admin marks each request paid after a manual transfer. */
export const vendorPayouts = pgTable(
  "vendor_payouts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    amountPaise: integer("amount_paise").notNull(),
    status: text("status").notNull().default("requested"), // requested, paid, rejected
    period: text("period"), // YYYY-MM
    requestedBy: text("requested_by").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    processedBy: text("processed_by"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    reference: text("reference"), // UTR / transfer id
    note: text("note"),
  },
  (t) => [
    index("vendor_payouts_vendor_idx").on(t.vendorId, t.status),
    check("vendor_payouts_status_check", sql`${t.status} in ('requested', 'paid', 'rejected')`),
    check("vendor_payouts_amount_check", sql`${t.amountPaise} > 0`),
  ]
);

/** One review per signed-in household per store. */
export const vendorReviews = pgTable(
  "vendor_reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "cascade" }), // set when they are also a customer
    userId: text("user_id").notNull(),
    authorName: text("author_name").notNull(), // shown as "Priya S."
    rating: integer("rating").notNull(), // 1..5
    comment: text("comment"),
    reply: text("reply"), // the store's public reply
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    isHidden: boolean("is_hidden").notNull().default(false), // hidden by admin
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("vendor_reviews_vendor_user_idx").on(t.vendorId, t.userId),
    index("vendor_reviews_vendor_visible_idx").on(t.vendorId, t.isHidden),
    check("vendor_reviews_rating_check", sql`${t.rating} between 1 and 5`),
  ]
);

/** Single-row platform knobs, edited at /admin/settings. */
export const platformSettings = pgTable("platform_settings", {
  id: integer("id").primaryKey().default(1),
  discoveryRadiusKm: integer("discovery_radius_km").notNull().default(10), // default household search radius; each household can pick its own
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Notification preferences for users (orders, plans, bills, reviews, pwa push). */
export const notificationPreferences = pgTable("notification_preferences", {
  userId: text("user_id").primaryKey(),
  emailOrders: boolean("email_orders").notNull().default(true),
  emailPlans: boolean("email_plans").notNull().default(true),
  emailBills: boolean("email_bills").notNull().default(true),
  emailReviews: boolean("email_reviews").notNull().default(true),
  pwaPush: boolean("pwa_push").notNull().default(true),
  pushSubscription: text("push_subscription"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
