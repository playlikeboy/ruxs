import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { vendors } from "./vendors";

/**
 * A business that asked to join from the public /apply form. Admin calls them,
 * verifies, then approves: that creates the vendor and its login.
 */
export const vendorApplications = pgTable(
  "vendor_applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessName: text("business_name").notNull(),
    ownerName: text("owner_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    categoryId: text("category_id").notNull(), // what they offer; decides the vendor type on approval
    area: text("area").notNull(),
    city: text("city").notNull(),
    details: text("details"),
    status: text("status").notNull().default("new"), // new, contacted, approved, rejected
    adminNotes: text("admin_notes"),
    vendorId: text("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("vendor_applications_status_idx").on(t.status, t.createdAt),
    index("vendor_applications_phone_idx").on(t.phone),
    check("vendor_applications_status_check", sql`${t.status} in ('new', 'contacted', 'approved', 'rejected')`),
  ]
);
