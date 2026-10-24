import "server-only";
import { and, eq, gt, gte, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  kidsChildren,
  kidsProviderProfiles,
  kidsServiceBookings,
  kidsServices,
  vendors,
} from "@/db/schema";
import {
  calculateAge,
  isAgeEligible,
  isClassEligible,
} from "@/core/kids/age-eligibility";
import {
  calculateKidsBookingTotal,
  canCancelKidsBooking,
  generateKidsBookingNumber,
  validateBookingWindow,
} from "@/core/kids/booking-rules";
import {
  KIDS_AWAITING_PROVIDER,
  canGuardianCancel,
  canProviderComplete,
  canProviderRespond,
} from "@/core/kids/booking-status";

export interface CreateBookingInput {
  guardianUserId: string;
  childId: string;
  serviceId: string;
  startsAt: Date;
  deliveryMode: "home" | "studio" | "online";
  address?: string;
  includeMaterials?: boolean;
  paymentMode: "online" | "pay_at_session";
  clientKey: string;
}

export async function createKidsBooking(input: CreateBookingInput) {
  // Online checkout is not wired to kids bookings yet; never confirm money we did not take.
  if (input.paymentMode !== "pay_at_session") {
    return { ok: false as const, error: "Online payment is not available for kids sessions yet. Choose pay at session." };
  }
  const db = getDb();

  // 1. Check idempotency first
  const [existing] = await db
    .select({
      id: kidsServiceBookings.id,
      number: kidsServiceBookings.number,
      guardianUserId: kidsServiceBookings.guardianUserId,
    })
    .from(kidsServiceBookings)
    .where(eq(kidsServiceBookings.clientKey, input.clientKey))
    .limit(1);

  if (existing) {
    if (existing.guardianUserId === input.guardianUserId) {
      return { ok: true as const, bookingId: existing.id, number: existing.number };
    }
    return { ok: false as const, error: "Invalid booking request key." };
  }

  // 2. Validate child belongs to this guardian
  const [child] = await db
    .select()
    .from(kidsChildren)
    .where(and(eq(kidsChildren.id, input.childId), eq(kidsChildren.guardianUserId, input.guardianUserId)))
    .limit(1);

  if (!child) {
    return { ok: false as const, error: "Child profile not found or does not belong to you." };
  }

  // 3. Validate service and vendor
  const [row] = await db
    .select({
      service: kidsServices,
      vendor: vendors,
    })
    .from(kidsServices)
    .innerJoin(vendors, eq(kidsServices.vendorId, vendors.id))
    .innerJoin(kidsProviderProfiles, eq(kidsProviderProfiles.vendorId, vendors.id))
    .where(
      and(
        eq(kidsServices.id, input.serviceId),
        eq(kidsServices.isActive, true),
        isNull(kidsServices.archivedAt),
        eq(vendors.status, "active"),
        eq(kidsProviderProfiles.verificationStatus, "approved"),
        eq(kidsProviderProfiles.safetyReviewStatus, "passed")
      )
    )
    .limit(1);

  if (!row) {
    return { ok: false as const, error: "Selected service is no longer available." };
  }

  const { service, vendor } = row;

  if (!vendor.acceptingOrders) {
    return { ok: false as const, error: `${vendor.name} is currently not accepting new bookings.` };
  }

  if (!service.deliveryModes.includes(input.deliveryMode)) {
    return { ok: false as const, error: `This activity does not support ${input.deliveryMode} delivery.` };
  }

  // 4. Validate age and class eligibility
  const childAge = calculateAge(child.birthDate || child.birthYear);
  if (childAge > 0 && !isAgeEligible(childAge, service.minAge, service.maxAge)) {
    return {
      ok: false as const,
      error: `Child must be between ${service.minAge} and ${service.maxAge} years old for this activity.`,
    };
  }

  if (child.schoolClass && service.suitableClasses.length > 0) {
    if (!isClassEligible(child.schoolClass, service.suitableClasses)) {
      return {
        ok: false as const,
        error: `Activity is intended for ${service.suitableClasses.join(", ")}.`,
      };
    }
  }

  // 5. Validate timing and duration
  const windowCheck = validateBookingWindow(input.startsAt, service.durationMinutes, vendor.bookingNoticeMinutes);
  if (!windowCheck.valid) {
    return { ok: false as const, error: windowCheck.reason || "Invalid session time." };
  }

  const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);

  // 6. Calculate price & material fee
  let materialFeePaise = 0;
  if (service.materialFeePolicy === "required") {
    materialFeePaise = service.materialFeePaise;
  } else if (service.materialFeePolicy === "extra" && input.includeMaterials) {
    materialFeePaise = service.materialFeePaise;
  }

  const pricing = calculateKidsBookingTotal(service.pricePaise, materialFeePaise, service.materialFeePolicy);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const number = generateKidsBookingNumber(dateStr);

  // 7. Transactional slot locking & reservation
  try {
    const result = await db.transaction(async (tx) => {
      // Advisory lock per vendor to prevent double booking the exact slot
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${vendor.id}))`);

      // Check for overlapping active bookings with this vendor
      const [overlap] = await tx
        .select({ id: kidsServiceBookings.id })
        .from(kidsServiceBookings)
        .where(
          and(
            eq(kidsServiceBookings.vendorId, vendor.id),
            inArray(kidsServiceBookings.bookingStatus, ["held", "confirmed"]),
            or(
              and(lte(kidsServiceBookings.startsAt, input.startsAt), gt(kidsServiceBookings.endsAt, input.startsAt)),
              and(lt(kidsServiceBookings.startsAt, endsAt), gte(kidsServiceBookings.endsAt, endsAt)),
              and(gte(kidsServiceBookings.startsAt, input.startsAt), lte(kidsServiceBookings.endsAt, endsAt))
            )
          )
        )
        .limit(1);

      if (overlap) {
        throw new Error("This timeslot was just taken by another parent. Please choose another time.");
      }

      const [newBooking] = await tx
        .insert(kidsServiceBookings)
        .values({
          number,
          clientKey: input.clientKey,
          serviceId: service.id,
          vendorId: vendor.id,
          guardianUserId: input.guardianUserId,
          childId: child.id,
          startsAt: input.startsAt,
          endsAt,
          deliveryMode: input.deliveryMode,
          address: input.address || null,
          priceSnapshotPaise: pricing.servicePaise,
          materialFeeSnapshotPaise: pricing.materialPaise,
          paymentStatus: "unpaid",
          // The provider accepts or declines from the merchant panel.
          bookingStatus: KIDS_AWAITING_PROVIDER,
          heldUntil: null,
        })
        .returning({ id: kidsServiceBookings.id, number: kidsServiceBookings.number });

      return newBooking;
    });

    return { ok: true as const, bookingId: result!.id, number: result!.number };
  } catch (err: unknown) {
    // A concurrent double submit with the same clientKey: return the booking that won.
    const [dupe] = await db
      .select({ id: kidsServiceBookings.id, number: kidsServiceBookings.number, guardianUserId: kidsServiceBookings.guardianUserId })
      .from(kidsServiceBookings)
      .where(eq(kidsServiceBookings.clientKey, input.clientKey))
      .limit(1);
    if (dupe?.guardianUserId === input.guardianUserId) return { ok: true as const, bookingId: dupe.id, number: dupe.number };
    if (err instanceof Error && err.message.includes("timeslot was just taken")) return { ok: false as const, error: err.message };
    return { ok: false as const, error: "This time is no longer available. Please choose another slot." };
  }
}

export async function cancelKidsBooking(input: { bookingId: string; guardianUserId: string; reason?: string }) {
  const db = getDb();

  const [booking] = await db
    .select({
      id: kidsServiceBookings.id,
      vendorId: kidsServiceBookings.vendorId,
      startsAt: kidsServiceBookings.startsAt,
      status: kidsServiceBookings.bookingStatus,
      paymentStatus: kidsServiceBookings.paymentStatus,
    })
    .from(kidsServiceBookings)
    .where(
      and(
        eq(kidsServiceBookings.id, input.bookingId),
        eq(kidsServiceBookings.guardianUserId, input.guardianUserId)
      )
    )
    .limit(1);

  if (!booking) {
    return { ok: false as const, error: "Booking not found or unauthorized." };
  }

  if (booking.status === "cancelled") {
    return { ok: true as const, message: "Booking was already cancelled." };
  }

  const [vendor] = await db
    .select({ cancelCutoffHours: vendors.cancelCutoffHours })
    .from(vendors)
    .where(eq(vendors.id, booking.vendorId))
    .limit(1);

  const cutoff = vendor?.cancelCutoffHours ?? 3;
  const cancelCheck = canCancelKidsBooking(booking.startsAt, cutoff);

  if (!cancelCheck.canCancel || !canGuardianCancel(booking.status, booking.startsAt)) {
    return { ok: false as const, error: "This session can no longer be cancelled." };
  }

  const nextPaymentStatus =
    booking.paymentStatus === "paid" && cancelCheck.refundEligible
      ? "refund_due"
      : booking.paymentStatus;

  const cancelled = await db
    .update(kidsServiceBookings)
    .set({
      bookingStatus: "cancelled",
      paymentStatus: nextPaymentStatus,
      cancellationReason: input.reason || "Cancelled by guardian",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(kidsServiceBookings.id, booking.id), eq(kidsServiceBookings.bookingStatus, booking.status)))
    .returning({ id: kidsServiceBookings.id });
  if (cancelled.length === 0) {
    return { ok: false as const, error: "This booking just changed. Refresh and try again." };
  }

  return {
    ok: true as const,
    refundEligible: cancelCheck.refundEligible,
  };
}

type ProviderDecision = "accept" | "decline";
type ProviderOutcome = "completed" | "cancelled";

/** Provider-side transitions. `vendorId` must come from requireVendorAccess(). */
export async function transitionKidsBookingForProvider(input: {
  vendorId: string;
  bookingId: string;
  action: ProviderDecision | ProviderOutcome;
  reason?: string;
}) {
  const db = getDb();
  const [booking] = await db
    .select({
      id: kidsServiceBookings.id,
      startsAt: kidsServiceBookings.startsAt,
      status: kidsServiceBookings.bookingStatus,
      paymentStatus: kidsServiceBookings.paymentStatus,
    })
    .from(kidsServiceBookings)
    .where(and(eq(kidsServiceBookings.id, input.bookingId), eq(kidsServiceBookings.vendorId, input.vendorId)))
    .limit(1);
  if (!booking) return { ok: false as const, error: "Booking not found." };

  const next = providerNextState(booking, input.action, input.reason);
  if (!next) return { ok: false as const, error: "This booking has already changed. Refresh and try again." };

  const [updated] = await db
    .update(kidsServiceBookings)
    .set({ ...next, updatedAt: new Date() })
    .where(and(eq(kidsServiceBookings.id, booking.id), eq(kidsServiceBookings.bookingStatus, booking.status)))
    .returning({ id: kidsServiceBookings.id });
  if (!updated) return { ok: false as const, error: "This booking has already changed. Refresh and try again." };
  return { ok: true as const };
}

function providerNextState(
  booking: { startsAt: Date; status: string; paymentStatus: string },
  action: ProviderDecision | ProviderOutcome,
  reason?: string
) {
  const cancelled = (fallback: string) => ({
    bookingStatus: "cancelled",
    cancellationReason: reason || fallback,
    cancelledAt: new Date(),
    ...(booking.paymentStatus === "paid" ? { paymentStatus: "refund_due" } : {}),
  });
  switch (action) {
    case "accept":
      return canProviderRespond(booking.status, booking.startsAt) ? { bookingStatus: "confirmed" } : null;
    case "decline":
      return canProviderRespond(booking.status, booking.startsAt) ? cancelled("Declined by the provider") : null;
    case "completed":
      return canProviderComplete(booking.status, booking.startsAt)
        ? { bookingStatus: "completed", ...(booking.paymentStatus === "unpaid" ? { paymentStatus: "paid" } : {}) }
        : null;
    case "cancelled":
      return booking.status === "confirmed" && booking.startsAt > new Date() ? cancelled("Cancelled by the provider") : null;
  }
}
