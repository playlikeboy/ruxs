import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

/** One browser/device that agreed to receive push notifications. A user can have several. */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("push_subscriptions_user_idx").on(t.userId)]
);

/** Every notification sent, keyed so retries and repeated cron runs never send twice. */
export const notificationLog = pgTable("notification_log", {
  key: text("key").primaryKey(), // e.g. "kids-reminder:<bookingId>:<userId>"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
