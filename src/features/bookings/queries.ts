import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityBlocks, availabilityRules, bookings, categories, customers, providerProfiles, services, vendors } from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { openSlots, type Busy } from "@/core/booking";
import { addDaysIST, istDateTime, todayIST } from "@/core/time";

/** Bookings that occupy the calendar: confirmed, or held and not yet expired. */
function activeBooking(now: Date) {
  return or(eq(bookings.status, "confirmed"), and(eq(bookings.status, "held"), gt(bookings.heldUntil, now)));
}

/** A service households can book right now, with its provider. */
export async function getBookableService(serviceId: string) {
  const db = getDb();
  const [row] = await db
    .select({ service: services, vendor: vendors, category: categories })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(
      and(
        eq(services.id, serviceId),
        eq(vendors.status, "active"),
        eq(vendors.businessType, "booking"),
        isNull(services.archivedAt),
        eq(services.isActive, true)
      )
    )
    .limit(1);
  return row ?? null;
}

/** Public provider page data: profile and active services. */
export async function getProviderPublic(vendorId: string) {
  const db = getDb();
  const [[profile], list] = await Promise.all([
    db.select().from(providerProfiles).where(eq(providerProfiles.vendorId, vendorId)).limit(1),
    db
      .select({ service: services, category: categories })
      .from(services)
      .innerJoin(categories, eq(services.categoryId, categories.id))
      .where(and(eq(services.vendorId, vendorId), isNull(services.archivedAt)))
      .orderBy(asc(services.sort), asc(services.pricePaise)),
  ]);
  return { profile: profile ?? null, services: list };
}

/** Free start times for the next `days` days, computed from rules, time off and bookings. */
export async function getSlotCalendar(input: { vendorId: string; durationMinutes: number; noticeMinutes: number; days: number }) {
  const db = getDb();
  const now = new Date();
  const from = todayIST();
  const until = istDateTime(addDaysIST(from, input.days), "00:00");
  const [rules, blocks, taken] = await Promise.all([
    db.select().from(availabilityRules).where(eq(availabilityRules.vendorId, input.vendorId)),
    db
      .select({ startsAt: availabilityBlocks.startsAt, endsAt: availabilityBlocks.endsAt })
      .from(availabilityBlocks)
      .where(and(eq(availabilityBlocks.vendorId, input.vendorId), lt(availabilityBlocks.startsAt, until), gt(availabilityBlocks.endsAt, now))),
    db
      .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
      .from(bookings)
      .where(and(eq(bookings.vendorId, input.vendorId), activeBooking(now), lt(bookings.startsAt, until), gt(bookings.endsAt, now))),
  ]);
  const busy: Busy[] = [...blocks, ...taken];
  return Array.from({ length: input.days }, (_, i) => {
    const date = addDaysIST(from, i);
    const slots = openSlots({ date, rules, busy, durationMinutes: input.durationMinutes, noticeMinutes: input.noticeMinutes, now });
    return { date, slots: slots.map((d) => d.toISOString()) };
  });
}

const myBookingFields = {
  booking: bookings,
  vendorName: vendors.name,
  vendorSlug: vendors.slug,
  vendorArea: vendors.area,
  vendorCity: vendors.city,
  cancelCutoffHours: vendors.cancelCutoffHours,
  serviceName: services.name,
  durationMinutes: services.durationMinutes,
};

export async function getMyBookings() {
  const user = await requireUser();
  const db = getDb();
  return db
    .select(myBookingFields)
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.startsAt))
    .limit(100);
}

export async function getMyBooking(bookingId: string) {
  const user = await requireUser();
  const db = getDb();
  const [row] = await db
    .select(myBookingFields)
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id)))
    .limit(1);
  return row ?? null;
}

export async function getProviderSchedule(slug: string, days = 14) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const from = new Date(Date.now() - 86_400_000);
  const until = istDateTime(addDaysIST(todayIST(), days), "00:00");
  const rows = await db
    .select({ booking: bookings, customerName: customers.name, customerPhone: customers.phone, serviceName: services.name })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.vendorId, access.vendorId),
        gte(bookings.startsAt, from),
        lt(bookings.startsAt, until),
        inArray(bookings.status, ["confirmed", "done", "no_show"])
      )
    )
    .orderBy(asc(bookings.startsAt));
  return { access, rows };
}

export async function getAvailability(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const [rules, blocks] = await Promise.all([
    db.select().from(availabilityRules).where(eq(availabilityRules.vendorId, access.vendorId)).orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime)),
    db.select().from(availabilityBlocks).where(and(eq(availabilityBlocks.vendorId, access.vendorId), gt(availabilityBlocks.endsAt, new Date()))).orderBy(asc(availabilityBlocks.startsAt)),
  ]);
  return { access, rules, blocks };
}

export async function getProviderServices(slug: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const rows = await db
    .select({ service: services, category: categories })
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(and(eq(services.vendorId, access.vendorId), isNull(services.archivedAt)))
    .orderBy(asc(services.sort), asc(services.name));
  return { access, rows };
}
