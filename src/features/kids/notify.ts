import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { kidsChildren, kidsServiceBookings, kidsServices, kidsWorkshopEnrollments, kidsWorkshops, vendors } from "@/db/schema";
import { notifyAfter, notifyVendorAfter } from "@/features/notifications/dispatch";

async function bookingContext(bookingId: string) {
  const [row] = await getDb()
    .select({ booking: kidsServiceBookings, serviceName: kidsServices.title, vendorName: vendors.name, slug: vendors.slug, childName: kidsChildren.displayName })
    .from(kidsServiceBookings)
    .innerJoin(vendors, eq(kidsServiceBookings.vendorId, vendors.id))
    .innerJoin(kidsChildren, eq(kidsServiceBookings.childId, kidsChildren.id))
    .leftJoin(kidsServices, eq(kidsServiceBookings.serviceId, kidsServices.id))
    .where(eq(kidsServiceBookings.id, bookingId))
    .limit(1);
  return row ? { ...row, serviceName: row.serviceName ?? "Activity session" } : null;
}

/** A parent asked for a session: the provider must accept it; the parent gets a receipt. */
export async function announceKidsRequest(bookingId: string) {
  const c = await bookingContext(bookingId);
  if (!c) return;
  const base = { serviceName: c.serviceName, startsAt: c.booking.startsAt, childName: c.childName };
  notifyVendorAfter(c.booking.vendorId, { kind: "vendor.kids.request", slug: c.slug, number: c.booking.number, ...base }, { onceKey: `kids-request:${bookingId}` });
  notifyAfter([c.booking.guardianUserId], { kind: "customer.kids.requested", vendorName: c.vendorName, ...base }, { onceKey: `kids-requested:${bookingId}` });
}

export async function announceKidsGuardianCancel(bookingId: string) {
  const c = await bookingContext(bookingId);
  if (!c) return;
  notifyVendorAfter(c.booking.vendorId, { kind: "vendor.kids.cancelled", slug: c.slug, number: c.booking.number, serviceName: c.serviceName, startsAt: c.booking.startsAt, childName: c.childName });
}

const PARENT_EVENT = {
  accept: "customer.kids.accepted",
  decline: "customer.kids.declined",
  cancelled: "customer.kids.cancelled",
  completed: "customer.kids.completed",
} as const;

export async function announceKidsProviderAction(bookingId: string, action: keyof typeof PARENT_EVENT, reason?: string) {
  const c = await bookingContext(bookingId);
  if (!c) return;
  notifyAfter(
    [c.booking.guardianUserId],
    { kind: PARENT_EVENT[action], serviceName: c.serviceName, vendorName: c.vendorName, startsAt: c.booking.startsAt, childName: c.childName, reason },
    { onceKey: `kids-${action}:${bookingId}` }
  );
}

export async function announceEnrollment(enrollmentId: string) {
  const [row] = await getDb()
    .select({ enrollment: kidsWorkshopEnrollments, workshop: kidsWorkshops, vendorName: vendors.name, slug: vendors.slug, childName: kidsChildren.displayName })
    .from(kidsWorkshopEnrollments)
    .innerJoin(kidsWorkshops, eq(kidsWorkshopEnrollments.workshopId, kidsWorkshops.id))
    .innerJoin(vendors, eq(kidsWorkshops.vendorId, vendors.id))
    .innerJoin(kidsChildren, eq(kidsWorkshopEnrollments.childId, kidsChildren.id))
    .where(eq(kidsWorkshopEnrollments.id, enrollmentId))
    .limit(1);
  if (!row) return;
  const w = row.workshop;
  notifyVendorAfter(w.vendorId, { kind: "vendor.enrollment.new", slug: row.slug, workshopTitle: w.title, startDate: w.startDate, childName: row.childName }, { onceKey: `enrol:${enrollmentId}` });
  notifyAfter(
    [row.enrollment.guardianUserId],
    { kind: "customer.enrollment.confirmed", workshopTitle: w.title, vendorName: row.vendorName, startDate: w.startDate, childName: row.childName, pricePaise: row.enrollment.priceSnapshotPaise },
    { onceKey: `enrolled:${enrollmentId}` }
  );
}
