import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
  doublePrecision,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";
import { products } from "./catalog";

/** A household that signed in to the RUXS app. Keyed by Hexclave user id. */
export const consumers = pgTable("consumers", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  society: text("society").notNull(),
  tower: text("tower").notNull(),
  floor: text("floor").notNull(),
  flat: text("flat").notNull(),
  landmark: text("landmark"),
  area: text("area").notNull(),
  city: text("city").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One-time cart orders placed from the app (subscriptions live in `orders`). */
export const shopOrders = pgTable(
  "shop_orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull().unique(),
    clientKey: text("client_key").notNull().unique(), // idempotency for double taps
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    status: text("status").notNull().default("placed"),
    paymentMode: text("payment_mode").notNull(), // cod, monthly_bill
    subtotalPaise: integer("subtotal_paise").notNull(),
    deliveryFeePaise: integer("delivery_fee_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),
    deliverOn: date("deliver_on").notNull(),
    slot: text("slot").notNull(), // asap, morning, lunch, evening, dinner
    address: text("address").notNull(), // snapshot at checkout
    notes: text("notes"),
    cancelReason: text("cancel_reason"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("shop_orders_vendor_status_idx").on(t.vendorId, t.status),
    index("shop_orders_user_idx").on(t.userId),
    check(
      "shop_orders_status_check",
      sql`${t.status} in ('placed', 'accepted', 'out_for_delivery', 'delivered', 'cancelled', 'rejected')`
    ),
    check("shop_orders_payment_check", sql`${t.paymentMode} in ('cod', 'monthly_bill')`),
    check(
      "shop_orders_slot_check",
      sql`${t.slot} in ('asap', 'morning', 'lunch', 'evening', 'dinner')`
    ),
  ]
);

export const shopOrderItems = pgTable(
  "shop_order_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => shopOrders.id, { onDelete: "cascade" }),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(), // snapshot
    unitPricePaise: integer("unit_price_paise").notNull(),
    qty: integer("qty").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
  },
  (t) => [
    index("shop_order_items_order_idx").on(t.orderId),
    uniqueIndex("shop_order_items_order_product_idx").on(t.orderId, t.productId),
    check("shop_order_items_qty_check", sql`${t.qty} > 0`),
  ]
);
