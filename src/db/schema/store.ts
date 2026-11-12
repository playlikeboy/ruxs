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

/**
 * RUXs Store: first-party kids products sold by RUXs itself. A separate domain
 * from vendor storefronts (no vendor_id), so store sales never reach vendor
 * balances, commission or payouts. Money is integer paise. Hand-written SQL:
 * migrations/0024_ruxs_store.sql.
 */

/** Store aisles (DIY kits, robotics, …). Admin-editable; `id` is the URL slug. */
export const storeCategories = pgTable("store_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  emojiIcon: text("emoji_icon").notNull().default("Package"), // lucide icon name, not an emoji
  sort: integer("sort").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One sellable item. Archived, never deleted (order items reference it). */
export const storeProducts = pgTable(
  "store_products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    categoryId: text("category_id")
      .notNull()
      .references(() => storeCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    brand: text("brand").notNull().default(""),
    sku: text("sku").notNull().unique(),
    pricePaise: integer("price_paise").notNull(), // what the household pays, GST included
    mrpPaise: integer("mrp_paise"), // printed MRP, shown struck through when higher
    gstBps: integer("gst_bps").notNull().default(1800), // GST rate inside the price, basis points
    stock: integer("stock").notNull().default(0),
    lowStockAt: integer("low_stock_at").notNull().default(5),
    ageMin: integer("age_min").notNull().default(0),
    ageMax: integer("age_max"), // null = "and up"
    skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
    boxContents: text("box_contents").array().notNull().default(sql`'{}'::text[]`),
    safetyNotes: text("safety_notes").notNull().default(""),
    images: text("images").array().notNull().default(sql`'{}'::text[]`),
    weightGrams: integer("weight_grams"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("store_products_category_idx").on(t.categoryId),
    check("store_products_price_check", sql`${t.pricePaise} > 0`),
    check("store_products_mrp_check", sql`${t.mrpPaise} is null or ${t.mrpPaise} >= ${t.pricePaise}`),
    check("store_products_stock_check", sql`${t.stock} >= 0`),
    check("store_products_age_check", sql`${t.ageMin} >= 0 and (${t.ageMax} is null or ${t.ageMin} <= ${t.ageMax})`),
    check("store_products_images_check", sql`cardinality(${t.images}) <= 6`),
  ]
);

/** Single row (id = 1): how the store sells and delivers. */
export const storeSettings = pgTable(
  "store_settings",
  {
    id: integer("id").primaryKey().default(1),
    isOpen: boolean("is_open").notNull().default(true),
    closedMessage: text("closed_message"),
    codEnabled: boolean("cod_enabled").notNull().default(true),
    codMaxPaise: integer("cod_max_paise"), // null = no limit
    deliveryFeePaise: integer("delivery_fee_paise").notNull().default(4000),
    freeDeliveryAbovePaise: integer("free_delivery_above_paise"), // null = never free
    minOrderPaise: integer("min_order_paise").notNull().default(0),
    serviceability: text("serviceability").notNull().default("geofence"), // geofence now, india later
    serviceCity: text("service_city").notNull().default("Ranchi"),
    serviceLatitude: doublePrecision("service_latitude").notNull().default(23.3441),
    serviceLongitude: doublePrecision("service_longitude").notNull().default(85.3096),
    serviceRadiusKm: integer("service_radius_km").notNull().default(25),
    dispatchDays: integer("dispatch_days").notNull().default(1),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("store_settings_singleton_check", sql`${t.id} = 1`),
    check("store_settings_serviceability_check", sql`${t.serviceability} in ('geofence', 'india')`),
  ]
);

/** Monthly counters behind RS-YYMM-#### order numbers (row-locked upsert, collision-safe). */
export const storeOrderCounters = pgTable("store_order_counters", {
  period: text("period").primaryKey(), // YYMM
  lastSeq: integer("last_seq").notNull().default(0),
});

export const storeOrders = pgTable(
  "store_orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id").notNull(), // Hexclave user id
    clientKey: text("client_key").notNull(), // idempotent placement, unique per user
    status: text("status").notNull().default("placed"),
    paymentMode: text("payment_mode").notNull(), // online, cod
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid, refund_due, refunded
    subtotalPaise: integer("subtotal_paise").notNull(),
    deliveryFeePaise: integer("delivery_fee_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(), // snapshot at checkout
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    notes: text("notes"),
    courier: text("courier"),
    trackingNumber: text("tracking_number"),
    adminNote: text("admin_note"),
    cancelReason: text("cancel_reason"),
    placedAt: timestamp("placed_at", { withTimezone: true }),
    packedAt: timestamp("packed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }), // out for delivery
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("store_orders_user_client_key_idx").on(t.userId, t.clientKey),
    index("store_orders_user_idx").on(t.userId, t.createdAt),
    index("store_orders_status_idx").on(t.status, t.createdAt),
    check(
      "store_orders_status_check",
      sql`${t.status} in ('awaiting_payment', 'placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned')`
    ),
    check("store_orders_payment_mode_check", sql`${t.paymentMode} in ('online', 'cod')`),
    check("store_orders_payment_status_check", sql`${t.paymentStatus} in ('unpaid', 'paid', 'refund_due', 'refunded')`),
    check(
      "store_orders_money_check",
      sql`${t.subtotalPaise} >= 0 and ${t.deliveryFeePaise} >= 0 and ${t.totalPaise} = ${t.subtotalPaise} + ${t.deliveryFeePaise}`
    ),
  ]
);

export const storeOrderItems = pgTable(
  "store_order_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "restrict" }),
    name: text("name").notNull(), // snapshot
    image: text("image"), // snapshot of the first image
    unitPricePaise: integer("unit_price_paise").notNull(),
    qty: integer("qty").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
  },
  (t) => [
    index("store_order_items_order_idx").on(t.orderId),
    check("store_order_items_qty_check", sql`${t.qty} > 0`),
    check("store_order_items_total_check", sql`${t.lineTotalPaise} = ${t.unitPricePaise} * ${t.qty}`),
  ]
);

/** Razorpay orders for store orders. Separate from vendor `payments` so payouts never see them. */
export const storePayments = pgTable(
  "store_payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    amountPaise: integer("amount_paise").notNull(),
    status: text("status").notNull().default("created"), // created, paid, failed
    failureReason: text("failure_reason"),
    refundId: text("refund_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("store_payments_order_idx").on(t.orderId),
    check("store_payments_status_check", sql`${t.status} in ('created', 'paid', 'failed')`),
    check("store_payments_amount_check", sql`${t.amountPaise} > 0`),
  ]
);

/** Insert-only stock audit (a trigger blocks UPDATE/DELETE). Product stock changes in the same transaction. */
export const storeStockMovements = pgTable(
  "store_stock_movements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "restrict" }),
    delta: integer("delta").notNull(),
    stockAfter: integer("stock_after").notNull(),
    reason: text("reason").notNull(), // restock, order, cancel, adjust
    orderId: text("order_id").references(() => storeOrders.id),
    actor: text("actor").notNull(), // user id, or "system"
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("store_stock_movements_product_idx").on(t.productId, t.createdAt),
    check("store_stock_movements_reason_check", sql`${t.reason} in ('restock', 'order', 'cancel', 'adjust')`),
    check("store_stock_movements_delta_check", sql`${t.delta} <> 0`),
  ]
);
