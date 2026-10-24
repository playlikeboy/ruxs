import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, kidsChildren, kidsServiceBookings, kidsServices, services, vendors } from "@/db/schema";
import { tomorrowRangeIST } from "@/core/reminders";
import { notifyUsers, vendorRecipientIds } from "./dispatch";

/**
 * Evening reminders for tomorrow's confirmed sessions: one per household per session,
 * plus one "your day tomorrow" summary per provider. Safe to run more than once.
 */
export async function sendTomorrowReminders(now: Date) {
  const db = getDb();
  const { date, from, until } = tomorrowRangeIST(now);

  const kids = await db
    .select({ b: kidsServiceBookings, serviceName: kidsServices.title, vendorName: vendors.name, slug: vendors.slug, childName: kidsChildren.displayName })
    .from(kidsServiceBookings)
    .innerJoin(vendors, eq(kidsServiceBookings.vendorId, vendors.id))
    .innerJoin(kidsChildren, eq(kidsServiceBookings.childId, kidsChildren.id))
    .leftJoin(kidsServices, eq(kidsServiceBookings.serviceId, kidsServices.id))
    .where(and(eq(kidsServiceBookings.bookingStatus, "confirmed"), gte(kidsServiceBookings.startsAt, from), lt(kidsServiceBookings.startsAt, until)))
    .orderBy(asc(kidsServiceBookings.startsAt));

  const sessions = await db
    .select({ b: bookings, serviceName: services.name, vendorName: vendors.name, slug: vendors.slug })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.startsAt, from), lt(bookings.startsAt, until)))
    .orderBy(asc(bookings.startsAt));

  for (const k of kids) {
    await notifyUsers(
      [k.b.guardianUserId],
      { kind: "customer.reminder", serviceName: k.serviceName ?? "Activity session", vendorName: k.vendorName, startsAt: k.b.startsAt, childName: k.childName, path: "/app/kids/bookings" },
      { onceKey: `reminder:kids:${k.b.id}` }
    );
  }
  for (const s of sessions) {
    await notifyUsers(
      [s.b.userId],
      { kind: "customer.reminder", serviceName: s.serviceName ?? "Your session", vendorName: s.vendorName, startsAt: s.b.startsAt, path: `/app/bookings/${s.b.id}` },
      { onceKey: `reminder:booking:${s.b.id}` }
    );
  }

  const byVendor = new Map<string, { slug: string; count: number; first: Date }>();
  for (const row of [...kids.map((k) => ({ vendorId: k.b.vendorId, slug: k.slug, at: k.b.startsAt })), ...sessions.map((s) => ({ vendorId: s.b.vendorId, slug: s.slug, at: s.b.startsAt }))]) {
    const v = byVendor.get(row.vendorId);
    if (!v) byVendor.set(row.vendorId, { slug: row.slug, count: 1, first: row.at });
    else byVendor.set(row.vendorId, { ...v, count: v.count + 1, first: row.at < v.first ? row.at : v.first });
  }
  for (const [vendorId, v] of byVendor) {
    await notifyUsers(await vendorRecipientIds(vendorId), { kind: "vendor.tomorrow", slug: v.slug, count: v.count, first: v.first }, { onceKey: `tomorrow:${vendorId}:${date}` });
  }

  return { reminders: kids.length + sessions.length, vendors: byVendor.size };
}
