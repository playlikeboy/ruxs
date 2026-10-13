import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { customers } from "./customers";
import { orders } from "./orders";

export const invoices = pgTable(
  "invoices",
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
    period: text("period").notNull(), // YYYY-MM
    number: text("number").notNull(), // RX-YYYYMM-seq
    openingPaise: integer("opening_paise").notNull().default(0),
    chargesPaise: integer("charges_paise").notNull().default(0),
    paymentsPaise: integer("payments_paise").notNull().default(0),
    closingPaise: integer("closing_paise").notNull().default(0),
    status: text("status").notNull().default("generated"), // draft, generated, sent, paid, partially_paid
    sentAt: timestamp("sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("invoices_vendor_cust_period_idx").on(
      t.vendorId,
      t.customerId,
      t.period
    ),
    index("invoices_vendor_period_idx").on(t.vendorId, t.period),
    check(
      "invoices_status_check",
      sql`${t.status} in ('draft', 'generated', 'sent', 'paid', 'partially_paid')`
    ),
  ]
);

export const ledgerEntries = pgTable(
  "ledger_entries",
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
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    invoiceId: text("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(), // delivery, late_fee, deposit, deposit_refund, payment, adjustment
    amountPaise: integer("amount_paise").notNull(), // signed: + household owes, - payment
    notes: text("notes"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("ledger_entries_idempotency_idx").on(t.idempotencyKey),
    index("ledger_entries_vendor_cust_idx").on(t.vendorId, t.customerId),
    check(
      "ledger_entries_type_check",
      sql`${t.type} in ('delivery', 'late_fee', 'deposit', 'deposit_refund', 'payment', 'adjustment')`
    ),
  ]
);

export const assetMovements = pgTable(
  "asset_movements",
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
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    asset: text("asset").notNull(), // can, dabba
    delta: integer("delta").notNull(), // + given to customer, - returned
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("asset_movements_vendor_cust_asset_idx").on(
      t.vendorId,
      t.customerId,
      t.asset
    ),
  ]
);
