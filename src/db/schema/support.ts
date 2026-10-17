import {
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { shopOrders } from "./shop";
import { subscriptions } from "./catalog";
import { bookings } from "./bookings";
import { vendorReviews } from "./platform";

/**
 * Support tickets, disputes, and reports.
 * Raised by households for order disputes, billing issues, delivery problems,
 * or reporting stores, services, and inappropriate reviews.
 */
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull().unique(), // e.g. TK-20261017-7B3FA
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    userPhone: text("user_phone").notNull(),
    userEmail: text("user_email"),

    // Target vendor (if related to a store, delivery, or service)
    vendorId: text("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    vendorName: text("vendor_name"),

    // Category: order_dispute, delivery_issue, billing_dispute, service_dispute, report_store, report_review, general_query
    category: text("category").notNull(),
    subject: text("subject").notNull(),
    description: text("description").notNull(),

    // Context links
    orderId: text("order_id").references(() => shopOrders.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
    reviewId: text("review_id").references(() => vendorReviews.id, { onDelete: "set null" }),

    // Status: open, in_progress, resolved, closed
    status: text("status").notNull().default("open"),
    // Priority: low, medium, high, urgent
    priority: text("priority").notNull().default("medium"),

    adminNotes: text("admin_notes"),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("support_tickets_user_idx").on(t.userId),
    index("support_tickets_vendor_idx").on(t.vendorId),
    index("support_tickets_status_idx").on(t.status),
    index("support_tickets_category_idx").on(t.category),
    index("support_tickets_created_idx").on(t.createdAt),
  ]
);

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
