"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { renderEmailHtml, sendEmail } from "./service";
import type { NotificationPreferences } from "./types";

export async function getMyNotificationPreferences(): Promise<NotificationPreferences> {
  const user = await requireUser();
  const db = getDb();

  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, user.id))
    .limit(1);

  if (row) {
    return {
      userId: row.userId,
      emailOrders: row.emailOrders,
      emailPlans: row.emailPlans,
      emailBills: row.emailBills,
      emailReviews: row.emailReviews,
      pwaPush: row.pwaPush,
      pushSubscription: row.pushSubscription,
    };
  }

  return {
    userId: user.id,
    emailOrders: true,
    emailPlans: true,
    emailBills: true,
    emailReviews: true,
    pwaPush: true,
    pushSubscription: null,
  };
}

export async function updateNotificationPreferences(input: {
  emailOrders: boolean;
  emailPlans: boolean;
  emailBills: boolean;
  emailReviews: boolean;
  pwaPush: boolean;
}) {
  const user = await requireUser();
  const db = getDb();

  const values = {
    userId: user.id,
    emailOrders: input.emailOrders,
    emailPlans: input.emailPlans,
    emailBills: input.emailBills,
    emailReviews: input.emailReviews,
    pwaPush: input.pwaPush,
    updatedAt: new Date(),
  };

  await db
    .insert(notificationPreferences)
    .values(values)
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: {
        emailOrders: input.emailOrders,
        emailPlans: input.emailPlans,
        emailBills: input.emailBills,
        emailReviews: input.emailReviews,
        pwaPush: input.pwaPush,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/app/account");
  return { ok: true as const };
}

export async function sendTestNotificationEmail() {
  const user = await requireUser();
  const email = user.primaryEmail;
  if (!email) {
    return { ok: false, error: "No primary email associated with your account" };
  }

  const html = renderEmailHtml({
    heading: "Notifications are working! 🎉",
    lead: "You're all set to receive timely updates on your deliveries, subscriptions, and orders from RUXs.",
    details: [
      { label: "Delivery address updates", value: "Active" },
      { label: "Notification domain", value: "notifications.ruxs.in" },
      { label: "Household member", value: user.displayName || user.primaryEmail || "Customer" },
    ],
    actionText: "Open RUXs App",
    actionUrl: "https://ruxs.in/app",
  });

  const text = `Hi ${user.displayName || "there"},\n\nNotifications are working!\nYou are all set to receive timely updates on your deliveries, subscriptions, and orders from RUXs.\n\nOpen RUXs App: https://ruxs.in/app`;

  const res = await sendEmail({
    to: email,
    fromType: "welcome",
    subject: "Test Notification from RUXs",
    html,
    text,
  });

  return res;
}
