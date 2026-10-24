import "server-only";
import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, notificationLog, notificationPreferences, pushSubscriptions, vendorMembers } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { sendWebPush } from "@/lib/webpush";
import { notificationCopy, type NotifyEvent } from "@/core/notify-copy";
import { renderEmailHtml, sendUserEmailIfAllowed } from "./service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in";

type Options = { onceKey?: string };

/** Claims a one-time key; false when this notification already went out. */
async function claim(key: string) {
  const rows = await getDb().insert(notificationLog).values({ key }).onConflictDoNothing().returning({ key: notificationLog.key });
  return rows.length > 0;
}

async function emailFor(userId: string) {
  const [row] = await getDb().select({ email: consumers.email }).from(consumers).where(eq(consumers.userId, userId)).limit(1);
  if (row?.email) return row.email;
  // Loaded lazily: only members without a stored email need the auth service.
  const { hexclave } = await import("@/lib/auth/hexclave");
  const user = await hexclave.getUser(userId);
  return user?.primaryEmail ?? null;
}

async function pushTo(userId: string, payload: string) {
  const env = getServerEnv();
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const db = getDb();
  const [pref] = await db.select({ pwaPush: notificationPreferences.pwaPush }).from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  if (pref && !pref.pwaPush) return;
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  const vapid = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: "mailto:alerts@notifications.ruxs.in" };
  const results = await Promise.all(subs.map(async (s) => ({ id: s.id, result: await sendWebPush(s, payload, vapid) })));
  const gone = results.filter((r) => r.result === "gone").map((r) => r.id);
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
}

async function deliver(userId: string, event: NotifyEvent, opts: Options) {
  if (opts.onceKey && !(await claim(`${opts.onceKey}:${userId}`))) return;
  const c = notificationCopy(event);
  const url = APP_URL + c.path;
  const payload = JSON.stringify({ title: c.push.title, body: c.push.body, url: c.path, tag: opts.onceKey ?? event.kind });
  const email = await emailFor(userId);
  await Promise.all([
    email
      ? sendUserEmailIfAllowed({
          userId,
          to: email,
          category: c.category,
          subject: c.subject,
          html: renderEmailHtml({ heading: c.heading, lead: c.lead, details: c.details, actionText: c.actionText, actionUrl: url }),
          text: `${c.lead}\n\n${c.actionText}: ${url}`,
        })
      : null,
    pushTo(userId, payload),
  ]);
}

/** Sends now. Never throws: a failed notification must not fail the order or booking. */
export async function notifyUsers(userIds: string[], event: NotifyEvent, opts: Options = {}) {
  const unique = [...new Set(userIds)].filter(Boolean);
  await Promise.all(
    unique.map((id) =>
      deliver(id, event, opts).catch((err) => console.error("Notification failed", event.kind, err instanceof Error ? err.message : err))
    )
  );
}

/** Owners and staff of a store. Drivers only get the run sheet. */
export async function vendorRecipientIds(vendorId: string) {
  const rows = await getDb()
    .select({ userId: vendorMembers.userId })
    .from(vendorMembers)
    .where(and(eq(vendorMembers.vendorId, vendorId), inArray(vendorMembers.role, ["owner", "staff"])));
  return rows.map((r) => r.userId);
}

/** Queues notifications to run after the response, so the user never waits on email or push. */
export function notifyAfter(userIds: string[] | (() => Promise<string[]>), event: NotifyEvent, opts: Options = {}) {
  after(async () => {
    try {
      const ids = typeof userIds === "function" ? await userIds() : userIds;
      await notifyUsers(ids, event, opts);
    } catch (err) {
      console.error("Notification failed", event.kind, err instanceof Error ? err.message : err);
    }
  });
}

/** Shorthand for "tell this store's owners and staff". */
export function notifyVendorAfter(vendorId: string, event: NotifyEvent, opts: Options = {}) {
  notifyAfter(() => vendorRecipientIds(vendorId), event, opts);
}
