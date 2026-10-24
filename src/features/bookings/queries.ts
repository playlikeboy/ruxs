import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityBlocks, availabilityRules, bookings, categories, customers, services, vendors } from "@/db/schema";
import { getPublicTypeDetails } from "@/features/vendor-types/queries";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { openSlots, type Busy } from "@/core/booking";
import { addDaysIST, istDateTime, todayIST } from "@/core/time";
import { isKidsVendorType } from "@/core/vendor-types";
import { getKidsBookingListRows, getKidsCalendarRows } from "@/features/kids/provider-calendar";

type Access = Awaited<ReturnType<typeof requireVendorAccess>>;

/** Kids academies keep their sessions in kids_service_bookings; merge them into every provider view. */
function hasKidsSessions(access: Access) {
  return isKidsVendorType(access.vendor.vendorType);
}

function byStart<T extends { booking: { startsAt: Date } }>(desc_ = false) {
  return (a: T, b: T) => (a.booking.startsAt.getTime() - b.booking.startsAt.getTime()) * (desc_ ? -1 : 1);
}

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

/** Public provider page data: the type's own profile (trainer, physio, mehndi) and active services. */
export async function getProviderPublic(vendorId: string) {
  const db = getDb();
  const list = await db
    .select({ service: services, category: categories })
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(and(eq(services.vendorId, vendorId), isNull(services.archivedAt)))
    .orderBy(asc(services.sort), asc(services.pricePaise));
  const details = await getPublicTypeDetails(vendorId, list.map((r) => r.service.id));
  const row = details.profile ?? null;
  const text = (k: string) => (typeof row?.[k] === "string" ? (row[k] as string) : null);
  const list_ = (k: string) => (Array.isArray(row?.[k]) ? (row[k] as string[]) : []);
  const profile = row
    ? {
        headline: text("headline"),
        qualifications: text("qualifications") ?? text("certifications"),
        experienceYears: typeof row.experienceYears === "number" ? row.experienceYears : null,
        specialities: [...list_("specialities"), ...list_("styles"), ...list_("conditionsTreated")].slice(0, 12),
        languages: list_("languages"),
        gender: text("gender"),
      }
    : null;
  return { profile, services: list, highlights: details.highlights, serviceChips: details.itemChips };
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
  const kids = hasKidsSessions(access)
    ? (await getKidsCalendarRows(access.vendorId, from, until)).filter((r) => ["requested", "confirmed", "done"].includes(r.booking.status))
    : [];
  return { access, rows: [...rows.map((r) => ({ ...r, kind: "service" as const })), ...kids].sort(byStart()) };
}

const calendarFields = {
  booking: bookings,
  customerName: customers.name,
  customerPhone: customers.phone,
  serviceName: services.name,
};

/** Merchant calendar: every booking between two IST dates, plus hours and time off to shade the grid. */
export async function getProviderCalendar(slug: string, fromDate: string, toDate: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const from = istDateTime(fromDate, "00:00");
  const until = istDateTime(addDaysIST(toDate, 1), "00:00");
  const [rows, rules, blocks] = await Promise.all([
    db
      .select(calendarFields)
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(and(eq(bookings.vendorId, access.vendorId), gte(bookings.startsAt, from), lt(bookings.startsAt, until), inArray(bookings.status, ["held", "confirmed", "done", "no_show", "cancelled"])))
      .orderBy(asc(bookings.startsAt)),
    db.select().from(availabilityRules).where(eq(availabilityRules.vendorId, access.vendorId)),
    db
      .select({ startsAt: availabilityBlocks.startsAt, endsAt: availabilityBlocks.endsAt, reason: availabilityBlocks.reason })
      .from(availabilityBlocks)
      .where(and(eq(availabilityBlocks.vendorId, access.vendorId), lt(availabilityBlocks.startsAt, until), gt(availabilityBlocks.endsAt, from))),
  ]);
  const kids = hasKidsSessions(access) ? await getKidsCalendarRows(access.vendorId, from, until) : [];
  return { access, rows: [...rows.map((r) => ({ ...r, kind: "service" as const })), ...kids].sort(byStart()), rules, blocks };
}

/** Merchant list view, like cal.com: upcoming, past or cancelled bookings. */
export async function getProviderBookingList(slug: string, tab: "upcoming" | "past" | "cancelled", limit = 60) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const now = new Date();
  const where =
    tab === "upcoming"
      ? and(eq(bookings.vendorId, access.vendorId), gte(bookings.endsAt, now), inArray(bookings.status, ["held", "confirmed"]))
      : tab === "past"
        ? and(eq(bookings.vendorId, access.vendorId), lt(bookings.endsAt, now), inArray(bookings.status, ["confirmed", "done", "no_show"]))
        : and(eq(bookings.vendorId, access.vendorId), eq(bookings.status, "cancelled"));
  const rows = await db
    .select(calendarFields)
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(where)
    .orderBy(tab === "upcoming" ? asc(bookings.startsAt) : desc(bookings.startsAt))
    .limit(limit);
  const kids = hasKidsSessions(access) ? await getKidsBookingListRows(access.vendorId, tab, limit) : [];
  const merged = [...rows.map((r) => ({ ...r, kind: "service" as const })), ...kids].sort(byStart(tab !== "upcoming"));
  return { access, rows: merged.slice(0, limit) };
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
