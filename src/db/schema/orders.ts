import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
  boolean,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";
import { products, subscriptions } from "./catalog";

export const dayChanges = pgTable(
  "day_changes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    serviceDate: date("service_date").notNull(),
    kind: text("kind").notNull(), // skip, extra, qty
    qty: integer("qty").notNull().default(0),
    source: text("source").notNull().default("link"), // link, vendor, pause
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isLate: boolean("is_late").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("day_changes_sub_date_idx").on(t.subscriptionId, t.serviceDate),
    index("day_changes_vendor_date_idx").on(t.vendorId, t.serviceDate),
    check("day_changes_kind_check", sql`${t.kind} in ('skip', 'extra', 'qty')`),
    check("day_changes_source_check", sql`${t.source} in ('link', 'vendor', 'pause')`),
  ]
);

export const orders = pgTable(
  "orders",
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
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    serviceDate: date("service_date").notNull(),
    shift: text("shift").notNull(), // lunch, dinner, etc.
    qty: integer("qty").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
    status: text("status").notNull().default("confirmed"), // confirmed, skipped, late_skip, delivered, failed
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    deliveredBy: text("delivered_by"),
    failedReason: text("failed_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("orders_sub_date_shift_idx").on(
      t.subscriptionId,
      t.serviceDate,
      t.shift
    ),
    index("orders_vendor_date_shift_idx").on(
      t.vendorId,
      t.serviceDate,
      t.shift
    ),
    index("orders_vendor_customer_idx").on(t.vendorId, t.customerId),
    check(
      "orders_status_check",
      sql`${t.status} in ('confirmed', 'skipped', 'late_skip', 'delivered', 'failed')`
    ),
  ]
);
