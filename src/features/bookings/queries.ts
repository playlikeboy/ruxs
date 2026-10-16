import "server-only";
import { and, asc, eq, gt, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityBlocks, availabilityRules, bookings, categories, customers, products, vendors } from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { openSlots, type Busy } from "@/core/booking";
import { addDaysIST, istDateTime, todayIST } from "@/core/time";

/** Bookings that occupy the calendar: confirmed, or held and not yet expired. */
function activeBooking(now: Date) {
  return or(eq(bookings.status, "confirmed"), and(eq(bookings.status, "held"), gt(bookings.heldUntil, now)));
}

export async function getBookableService(productId: string) {
  const db = getDb();
  const [row] = await db
    .select({ product: products, vendor: vendors, fulfilment: categories.fulfilment })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(categories, eq(products.kind, categories.id))
    .where(and(eq(products.id, productId), eq(vendors.status, "active"), isNull(products.archivedAt), eq(products.isAvailable, true)))
    .limit(1);
  if (!row || row.fulfilment !== "booking") return null;
  return row;
}

/** Free start times for the next `days` days, computed from rules, time off and bookings. */
export async function getSlotCalendar(input: {
  vendorId: string;
  durationMinutes: number;
  noticeMinutes: number;
  days: number;
}) {
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
    const slots = openSlots({
      date,
      rules,
      busy,
      durationMinutes: input.durationMinutes,
      noticeMinutes: input.noticeMinutes,
      now,
    });
    return { date, slots: slots.map((d) => d.toISOString()) };
  });
}

export async function getMyBookings() {
  const user = await requireUser();
  const db = getDb();
  const since = new Date(Date.now() - 14 * 86_400_000);
  return db
    .select({ booking: bookings, vendorName: vendors.name, vendorSlug: vendors.slug, productName: products.name, cancelCutoffHours: vendors.cancelCutoffHours })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .leftJoin(products, eq(bookings.productId, products.id))
    .where(and(eq(bookings.userId, user.id), gte(bookings.startsAt, since), inArray(bookings.status, ["held", "confirmed", "done", "no_show"])))
    .orderBy(asc(bookings.startsAt))
    .limit(50);
}

export async function getBookingForOrder(orderId: string) {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, cancelCutoffHours: vendors.cancelCutoffHours, vendorArea: vendors.area })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .where(eq(bookings.shopOrderId, orderId))
    .limit(1);
  return row ?? null;
}

/** Whether a store sells anything in a booking category (trainers, physio…). */
export async function isBookingProvider(vendorId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .innerJoin(categories, eq(products.kind, categories.id))
    .where(and(eq(products.vendorId, vendorId), eq(categories.fulfilment, "booking"), isNull(products.archivedAt)))
    .limit(1);
  return !!row;
}

export async function getProviderSchedule(slug: string, days = 14) {
  const access = await requireVendorAccess(slug);
  const db = getDb();
  const now = new Date();
  const from = new Date(now.getTime() - 86_400_000);
  const until = istDateTime(addDaysIST(todayIST(), days), "00:00");
  const rows = await db
    .select({ booking: bookings, customerName: customers.name, customerPhone: customers.phone, productName: products.name })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(products, eq(bookings.productId, products.id))
    .where(and(eq(bookings.vendorId, access.vendorId), gte(bookings.startsAt, from), lt(bookings.startsAt, until), inArray(bookings.status, ["confirmed", "done", "no_show"])))
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
