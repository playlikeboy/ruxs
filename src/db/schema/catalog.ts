import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
  boolean,
  index,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";

export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // categories.id
    name: text("name").notNull(),
    shift: text("shift").notNull(), // lunch, dinner, morning, evening
    pricePaise: integer("price_paise").notNull(),
    depositPaise: integer("deposit_paise").notNull().default(0),
    assetName: text("asset_name"), // can, dabba
    pollAt: text("poll_at"), // e.g. "08:30"
    cutoffAt: text("cutoff_at").notNull(), // e.g. "10:00"
    lateRule: text("late_rule").notNull().default("full"), // free, half, full, locked
    description: text("description"),
    section: text("section"), // menu heading, e.g. "Thalis"
    imageUrl: text("image_url"),
    isVeg: boolean("is_veg"),
    isAvailable: boolean("is_available").notNull().default(true),
    allowSubscription: boolean("allow_subscription").notNull().default(true),
    allowOneTime: boolean("allow_one_time").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }), // soft delete: orders keep their product
    durationMinutes: integer("duration_minutes"), // booking services only: session length
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("products_vendor_idx").on(t.vendorId),
    check(
      "products_shift_check",
      sql`${t.shift} in ('lunch', 'dinner', 'morning', 'evening')`
    ),
    check(
      "products_late_rule_check",
      sql`${t.lateRule} in ('free', 'half', 'full', 'locked')`
    ),
  ]
);

export const subscriptions = pgTable(
  "subscriptions",
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
    qty: integer("qty").notNull().default(1),
    days: text("days").array().notNull(), // ['mon', 'tue', ...]
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("subscriptions_vendor_customer_idx").on(t.vendorId, t.customerId),
    index("subscriptions_vendor_product_idx").on(t.vendorId, t.productId),
  ]
);
