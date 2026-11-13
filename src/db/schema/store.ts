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
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * RUXs Store: first-party kids products sold by RUXs itself. A separate domain
 * from vendor storefronts (no vendor_id), so store sales never reach vendor
 * balances, commission or payouts. Money is integer paise. Hand-written SQL:
 * migrations/0024_ruxs_store.sql and 0025_ruxs_store_v2.sql (pan-India shipping,
 * zones, fulfilment partners, coupons, reviews, wishlist, returns, collections, audit).
 *
 * Fulfilment partners are INTERNAL: nothing from store_fulfilment_partners or the
 * partner_* / forwarded_at columns may reach a household-facing type, page or email.
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
    serviceability: text("serviceability").notNull().default("india"), // india = ships everywhere; geofence = one city
    serviceCity: text("service_city").notNull().default("Ranchi"),
    serviceLatitude: doublePrecision("service_latitude").notNull().default(23.3441),
    serviceLongitude: doublePrecision("service_longitude").notNull().default(85.3096),
    serviceRadiusKm: integer("service_radius_km").notNull().default(25),
    dispatchDays: integer("dispatch_days").notNull().default(1),
    /** Delivery estimate for PIN codes no shipping zone covers. */
    defaultEtaMinDays: integer("default_eta_min_days").notNull().default(3),
    defaultEtaMaxDays: integer("default_eta_max_days").notNull().default(7),
    /** Days after delivery a household may ask for a return. 0 = no returns. */
    returnWindowDays: integer("return_window_days").notNull().default(7),
    /** Internal: send each placed order to the best-matching fulfilment partner. */
    autoForward: boolean("auto_forward").notNull().default(false),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("store_settings_singleton_check", sql`${t.id} = 1`),
    check("store_settings_serviceability_check", sql`${t.serviceability} in ('geofence', 'india')`),
    check(
      "store_settings_eta_check",
      sql`${t.defaultEtaMinDays} >= 0 and ${t.defaultEtaMaxDays} >= ${t.defaultEtaMinDays} and ${t.returnWindowDays} >= 0`
    ),
  ]
);

/**
 * Delivery fee, estimate and COD by destination. Resolution (core/store
 * resolveShippingZone): longest PIN prefix match, then state, then the
 * store_settings defaults.
 */
export const storeShippingZones = pgTable(
  "store_shipping_zones",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    pinPrefixes: text("pin_prefixes").array().notNull().default(sql`'{}'::text[]`), // "834", "8340", "110001"
    states: text("states").array().notNull().default(sql`'{}'::text[]`), // names from INDIAN_STATES
    feePaise: integer("fee_paise").notNull().default(0),
    freeAbovePaise: integer("free_above_paise"), // null = never free
    etaMinDays: integer("eta_min_days").notNull().default(3),
    etaMaxDays: integer("eta_max_days").notNull().default(7),
    codAllowed: boolean("cod_allowed").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("store_shipping_zones_fee_check", sql`${t.feePaise} >= 0 and (${t.freeAbovePaise} is null or ${t.freeAbovePaise} >= 0)`),
    check("store_shipping_zones_eta_check", sql`${t.etaMinDays} >= 0 and ${t.etaMaxDays} >= ${t.etaMinDays}`),
  ]
);

/** INTERNAL ONLY. Agencies that pick, pack and deliver store orders for RUXs. Never shown to households. */
export const storeFulfilmentPartners = pgTable("store_fulfilment_partners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  coverageStates: text("coverage_states").array().notNull().default(sql`'{}'::text[]`),
  coveragePinPrefixes: text("coverage_pin_prefixes").array().notNull().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Discount codes. `code` is stored upper-case; a unique index on upper(code) makes it case-insensitive. */
export const storeCoupons = pgTable(
  "store_coupons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind").notNull(), // percent, flat
    value: integer("value").notNull(), // percent: basis points (1000 = 10%); flat: paise
    minOrderPaise: integer("min_order_paise").notNull().default(0),
    maxDiscountPaise: integer("max_discount_paise"), // cap for percent coupons; null = no cap
    usageLimit: integer("usage_limit"), // total orders; null = unlimited
    perUserLimit: integer("per_user_limit"), // orders per household; null = unlimited
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("store_coupons_code_idx").on(sql`upper(${t.code})`),
    check("store_coupons_kind_check", sql`${t.kind} in ('percent', 'flat')`),
    check("store_coupons_value_check", sql`${t.value} > 0 and (${t.kind} <> 'percent' or ${t.value} <= 10000)`),
    check(
      "store_coupons_limits_check",
      sql`${t.minOrderPaise} >= 0 and (${t.maxDiscountPaise} is null or ${t.maxDiscountPaise} > 0) and (${t.usageLimit} is null or ${t.usageLimit} > 0) and (${t.perUserLimit} is null or ${t.perUserLimit} > 0)`
    ),
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
    discountPaise: integer("discount_paise").notNull().default(0), // coupon discount, taken off the subtotal
    totalPaise: integer("total_paise").notNull(), // subtotal + delivery fee - discount
    couponId: text("coupon_id").references(() => storeCoupons.id),
    couponCode: text("coupon_code"), // snapshot
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email"), // snapshot, for order emails
    phone: text("phone").notNull(),
    address: text("address").notNull(), // one-line snapshot at checkout
    // Structured ship-to snapshot (null only on orders placed before 0025).
    shipLine1: text("ship_line1"),
    shipLine2: text("ship_line2"),
    shipLandmark: text("ship_landmark"),
    shipCity: text("ship_city"),
    shipState: text("ship_state"),
    shipPincode: text("ship_pincode"),
    zoneId: text("zone_id").references(() => storeShippingZones.id),
    zoneName: text("zone_name"), // snapshot
    etaMinDays: integer("eta_min_days"),
    etaMaxDays: integer("eta_max_days"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    notes: text("notes"),
    courier: text("courier"),
    trackingNumber: text("tracking_number"),
    adminNote: text("admin_note"),
    cancelReason: text("cancel_reason"),
    // INTERNAL fulfilment: never select these into a household-facing shape.
    partnerId: text("partner_id").references(() => storeFulfilmentPartners.id),
    forwardedAt: timestamp("forwarded_at", { withTimezone: true }),
    forwardEmailedAt: timestamp("forward_emailed_at", { withTimezone: true }),
    partnerRef: text("partner_ref"),
    partnerStatusNote: text("partner_status_note"),
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
    index("store_orders_partner_idx").on(t.partnerId),
    check(
      "store_orders_status_check",
      sql`${t.status} in ('awaiting_payment', 'placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned')`
    ),
    check("store_orders_payment_mode_check", sql`${t.paymentMode} in ('online', 'cod')`),
    check("store_orders_payment_status_check", sql`${t.paymentStatus} in ('unpaid', 'paid', 'refund_due', 'refunded')`),
    check(
      "store_orders_money_check",
      sql`${t.subtotalPaise} >= 0 and ${t.deliveryFeePaise} >= 0 and ${t.discountPaise} >= 0 and ${t.discountPaise} <= ${t.subtotalPaise} and ${t.totalPaise} = ${t.subtotalPaise} + ${t.deliveryFeePaise} - ${t.discountPaise}`
    ),
    check("store_orders_pincode_check", sql`${t.shipPincode} is null or ${t.shipPincode} ~ '^[1-9][0-9]{5}$'`),
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
    reason: text("reason").notNull(), // restock, order, cancel, adjust, return
    orderId: text("order_id").references(() => storeOrders.id),
    actor: text("actor").notNull(), // user id, or "system"
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("store_stock_movements_product_idx").on(t.productId, t.createdAt),
    check("store_stock_movements_reason_check", sql`${t.reason} in ('restock', 'order', 'cancel', 'adjust', 'return')`),
    check("store_stock_movements_delta_check", sql`${t.delta} <> 0`),
  ]
);

/** Insert-only (trigger). One row per order that used a coupon; cancelled orders stop counting towards limits. */
export const storeCouponRedemptions = pgTable(
  "store_coupon_redemptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    couponId: text("coupon_id")
      .notNull()
      .references(() => storeCoupons.id, { onDelete: "restrict" }),
    orderId: text("order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull(),
    discountPaise: integer("discount_paise").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("store_coupon_redemptions_order_idx").on(t.orderId),
    index("store_coupon_redemptions_coupon_idx").on(t.couponId, t.userId),
    check("store_coupon_redemptions_discount_check", sql`${t.discountPaise} >= 0`),
  ]
);

/** One review per household per product, only after a delivered order. Shown once published. */
export const storeProductReviews = pgTable(
  "store_product_reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull(),
    orderId: text("order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("pending"), // pending, published, hidden
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("store_product_reviews_product_user_idx").on(t.productId, t.userId),
    index("store_product_reviews_status_idx").on(t.status, t.createdAt),
    check("store_product_reviews_rating_check", sql`${t.rating} between 1 and 5`),
    check("store_product_reviews_status_check", sql`${t.status} in ('pending', 'published', 'hidden')`),
  ]
);

export const storeWishlist = pgTable(
  "store_wishlist",
  {
    userId: text("user_id").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })]
);

/** "Tell me when it is back": emailed once when stock goes from 0 to above 0 (notified_at set). */
export const storeStockAlerts = pgTable(
  "store_stock_alerts",
  {
    userId: text("user_id").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),
    email: text("email").notNull(), // snapshot of where to send it
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] }), index("store_stock_alerts_pending_idx").on(t.productId).where(sql`${t.notifiedAt} is null`)]
);

/** Whole-order return asked for by the household within settings.return_window_days of delivery. */
export const storeReturnRequests = pgTable(
  "store_return_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("requested"), // requested, approved, rejected, received, refunded
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
  },
  (t) => [
    // One live request per order; a rejected one does not block asking again.
    uniqueIndex("store_return_requests_order_idx").on(t.orderId).where(sql`${t.status} <> 'rejected'`),
    index("store_return_requests_status_idx").on(t.status, t.createdAt),
    index("store_return_requests_user_idx").on(t.userId),
    check("store_return_requests_status_check", sql`${t.status} in ('requested', 'approved', 'rejected', 'received', 'refunded')`),
  ]
);

/** Curated rails on the shop home ("Diwali gifts", "Under 499"). */
export const storeCollections = pgTable("store_collections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const storeCollectionProducts = pgTable(
  "store_collection_products",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => storeCollections.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.productId] }), index("store_collection_products_product_idx").on(t.productId)]
);

/** Insert-only (trigger): who did what in the seller portal. */
export const storeAuditLog = pgTable(
  "store_audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorUserId: text("actor_user_id").notNull(), // admin user id, or "system"
    action: text("action").notNull(), // e.g. "order.forward"
    entity: text("entity").notNull(), // e.g. "order"
    entityId: text("entity_id"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("store_audit_log_entity_idx").on(t.entity, t.entityId, t.createdAt), index("store_audit_log_created_idx").on(t.createdAt)]
);
