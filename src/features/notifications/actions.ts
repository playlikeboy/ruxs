"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences, pushSubscriptions } from "@/db/schema";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { renderEmailHtml, sendEmail } from "./service";
import { notifyUsers } from "./dispatch";
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

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(40).max(200), auth: z.string().min(16).max(64) }),
});

/** Saves this device's push subscription for the signed-in user (one row per device). */
export async function savePushSubscription(input: unknown) {
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "This browser sent an invalid subscription." };
  const user = await requireUser();
  const { endpoint, keys } = parsed.data;
  await getDb()
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth } });
  return { ok: true as const };
}

export async function removePushSubscription(input: unknown) {
  const parsed = z.object({ endpoint: z.string().url().max(1000) }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid subscription." };
  const user = await requireUser();
  await getDb()
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, parsed.data.endpoint), eq(pushSubscriptions.userId, user.id)));
  return { ok: true as const };
}

/** Sends a test email and push to the signed-in user so they can see alerts working. */
export async function sendMyTestAlert(input: unknown) {
  const parsed = z.object({ path: z.string().startsWith("/").max(200) }).safeParse(input);
  const user = await requireUser();
  await notifyUsers([user.id], { kind: "account.test", path: parsed.success ? parsed.data.path : "/" });
  return { ok: true as const };
}
