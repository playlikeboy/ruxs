import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

export const vendors = pgTable(
  "vendors",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    upiVpa: text("upi_vpa").notNull(),
    city: text("city").notNull(),
    area: text("area").notNull(),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("vendors_slug_idx").on(t.slug),
    check("vendors_plan_check", sql`${t.plan} in ('free', 'starter', 'pro')`),
    check(
      "vendors_status_check",
      sql`${t.status} in ('pending', 'active', 'suspended')`
    ),
  ]
);

export const vendorMembers = pgTable(
  "vendor_members",
  {
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(), // Hexclave user ID
    role: text("role").notNull(), // owner, staff, driver
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.vendorId, t.userId] }),
    index("vendor_members_user_id_idx").on(t.userId),
    check("vendor_members_role_check", sql`${t.role} in ('owner', 'staff', 'driver')`),
  ]
);

export const vendorInvites = pgTable(
  "vendor_invites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    email: text("email").notNull(), // lower-cased
    role: text("role").notNull(), // staff, driver
    createdBy: text("created_by").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedUserId: text("accepted_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("vendor_invites_vendor_email_idx").on(t.vendorId, t.email),
    index("vendor_invites_email_idx").on(t.email),
    check("vendor_invites_role_check", sql`${t.role} in ('staff', 'driver')`),
  ]
);
