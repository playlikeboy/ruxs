import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";

export const customers = pgTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    userId: text("user_id"), // Hexclave user id when the household signed up in the RUXS app
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    society: text("society").notNull(),
    tower: text("tower").notNull(),
    floor: text("floor").notNull(),
    flat: text("flat").notNull(),
    optedInAt: timestamp("opted_in_at", { withTimezone: true }),
    linkTokenHash: text("link_token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("customers_vendor_phone_idx").on(t.vendorId, t.phone),
    uniqueIndex("customers_vendor_user_idx").on(t.vendorId, t.userId),
    index("customers_vendor_run_idx").on(
      t.vendorId,
      t.society,
      t.tower,
      t.floor
    ),
    index("customers_link_token_hash_idx").on(t.linkTokenHash),
  ]
);
