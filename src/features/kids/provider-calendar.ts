import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, kidsChildren, kidsServiceBookings, kidsServices } from "@/db/schema";
import { KIDS_AWAITING_PROVIDER, toCalendarStatus } from "@/core/kids/booking-status";

/** One kids session in the shape the merchant calendar and Today screen render. */
export interface KidsCalendarRow {
  kind: "kids";
  booking: {
    id: string;
    number: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    mode: string;
    address: string | null;
    pricePaise: number;
    paymentMode: string;
    paymentStatus: string;
    notes: string | null;
  };
  customerName: string;
  customerPhone: string;
  serviceName: string | null;
}

const fields = {
  booking: kidsServiceBookings,
  serviceName: kidsServices.title,
  childName: kidsChildren.displayName,
  childClass: kidsChildren.schoolClass,
  childNotes: kidsChildren.activityNotes,
  guardianName: consumers.name,
  guardianPhone: consumers.phone,
};

type Raw = {
  booking: typeof kidsServiceBookings.$inferSelect;
  serviceName: string | null;
  childName: string;
  childClass: string | null;
  childNotes: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
};

function toRow(r: Raw, now: Date): KidsCalendarRow {
  const b = r.booking;
  const child = r.childClass ? `${r.childName} (${r.childClass})` : r.childName;
  return {
    kind: "kids",
    booking: {
      id: b.id,
      number: b.number,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      status: toCalendarStatus(b.bookingStatus, b.startsAt, now),
      mode: b.deliveryMode,
      address: b.address,
      pricePaise: b.priceSnapshotPaise + b.materialFeeSnapshotPaise,
      paymentMode: "pay_at_session",
      paymentStatus: b.paymentStatus,
      notes: r.childNotes,
    },
    customerName: r.guardianName ? `${child} · parent ${r.guardianName}` : child,
    customerPhone: r.guardianPhone ?? "",
    serviceName: r.serviceName,
  };
}

function baseQuery() {
  return getDb()
    .select(fields)
    .from(kidsServiceBookings)
    .innerJoin(kidsChildren, eq(kidsServiceBookings.childId, kidsChildren.id))
    .leftJoin(kidsServices, eq(kidsServiceBookings.serviceId, kidsServices.id))
    .leftJoin(consumers, eq(consumers.userId, kidsServiceBookings.guardianUserId));
}

/** Kids sessions starting in [from, until). `vendorId` must come from requireVendorAccess(). */
export async function getKidsCalendarRows(vendorId: string, from: Date, until: Date) {
  const now = new Date();
  const rows = await baseQuery()
    .where(and(eq(kidsServiceBookings.vendorId, vendorId), gte(kidsServiceBookings.startsAt, from), lt(kidsServiceBookings.startsAt, until)))
    .orderBy(asc(kidsServiceBookings.startsAt));
  return rows.map((r) => toRow(r, now));
}

export async function getKidsBookingListRows(vendorId: string, tab: "upcoming" | "past" | "cancelled", limit: number) {
  const now = new Date();
  const status = kidsServiceBookings.bookingStatus;
  const where =
    tab === "upcoming"
      ? and(eq(kidsServiceBookings.vendorId, vendorId), gte(kidsServiceBookings.endsAt, now), inArray(status, [KIDS_AWAITING_PROVIDER, "confirmed"]))
      : tab === "past"
        ? and(
            eq(kidsServiceBookings.vendorId, vendorId),
            or(and(lt(kidsServiceBookings.endsAt, now), inArray(status, ["confirmed", "completed"])), eq(status, "completed"))
          )
        : and(eq(kidsServiceBookings.vendorId, vendorId), eq(status, "cancelled"));
  const rows = await baseQuery()
    .where(where)
    .orderBy(tab === "upcoming" ? asc(kidsServiceBookings.startsAt) : desc(kidsServiceBookings.startsAt))
    .limit(limit);
  return rows.map((r) => toRow(r, now));
}

/** Requests waiting for the provider to accept or decline. */
export async function countKidsRequests(vendorId: string) {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(kidsServiceBookings)
    .where(
      and(
        eq(kidsServiceBookings.vendorId, vendorId),
        eq(kidsServiceBookings.bookingStatus, KIDS_AWAITING_PROVIDER),
        gte(kidsServiceBookings.startsAt, new Date())
      )
    );
  return row?.n ?? 0;
}
