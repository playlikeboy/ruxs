"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  kidsChildren,
  kidsReviews,
  kidsServiceBookings,
  kidsServices,
  kidsWorkshopEnrollments,
  kidsWorkshops,
} from "@/db/schema";
import { isReviewEligible } from "@/core/kids/booking-status";
import { todayIST } from "@/core/time";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { rupeesToPaise } from "@/core/money";
import { createKidsBooking, cancelKidsBooking, transitionKidsBookingForProvider } from "./booking-service";
import { announceEnrollment, announceKidsGuardianCancel, announceKidsProviderAction, announceKidsRequest } from "./notify";
import { enrollInWorkshop, cancelWorkshopEnrollment } from "./workshop-service";
import { purchaseHolidayPass, redeemPassCredit } from "./holiday-pass-service";
import { recordGuardianConsent, updateProviderVerification } from "./safety-service";
import {
  adminVerifyProviderSchema,
  bookKidsServiceSchema,
  cancelKidsBookingSchema,
  cancelWorkshopEnrollmentSchema,
  childIdSchema,
  enrollWorkshopSchema,
  providerKidsBookingSchema,
  purchasePassSchema,
  redeemPassSchema,
  saveChildSchema,
  saveConsentSchema,
  saveKidsServiceSchema,
  saveKidsWorkshopSchema,
  submitKidsReviewSchema,
} from "./schemas";

function fail(error: string) {
  return { ok: false as const, error };
}

/* -------------------------------------------------------------------------- */
/* Child Profile Management (Guardian Scoped)                                */
/* -------------------------------------------------------------------------- */

export async function saveChildAction(input: unknown) {
  const parsed = saveChildSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid child details.");

  const user = await requireUser();
  const db = getDb();
  const data = parsed.data;

  if (data.id) {
    // Update existing child profile
    const [existing] = await db
      .select({ id: kidsChildren.id })
      .from(kidsChildren)
      .where(and(eq(kidsChildren.id, data.id), eq(kidsChildren.guardianUserId, user.id)))
      .limit(1);

    if (!existing) return fail("Child profile not found or unauthorized.");

    await db
      .update(kidsChildren)
      .set({
        displayName: data.displayName,
        birthYear: data.birthYear,
        birthDate: data.birthDate || null,
        schoolClass: data.schoolClass || null,
        activityNotes: data.activityNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(kidsChildren.id, data.id));

    revalidatePath("/app/kids/children");
    return { ok: true as const, childId: data.id };
  }

  // Create new child profile
  const [created] = await db
    .insert(kidsChildren)
    .values({
      guardianUserId: user.id,
      displayName: data.displayName,
      birthYear: data.birthYear,
      birthDate: data.birthDate || null,
      schoolClass: data.schoolClass || null,
      activityNotes: data.activityNotes || null,
    })
    .returning({ id: kidsChildren.id });

  revalidatePath("/app/kids/children");
  return { ok: true as const, childId: created!.id };
}

export async function deleteChildAction(input: unknown) {
  const parsed = childIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid child identifier.");

  const user = await requireUser();
  const db = getDb();

  // Guard: check if child has active bookings
  const [activeBooking] = await db
    .select({ id: kidsServiceBookings.id })
    .from(kidsServiceBookings)
    .where(
      and(
        eq(kidsServiceBookings.childId, parsed.data.childId),
        inArray(kidsServiceBookings.bookingStatus, ["held", "confirmed"])
      )
    )
    .limit(1);

  if (activeBooking) {
    return fail("Cancel this child's upcoming sessions and requests before removing the profile.");
  }

  try {
    await db
      .delete(kidsChildren)
      .where(and(eq(kidsChildren.id, parsed.data.childId), eq(kidsChildren.guardianUserId, user.id)));
  } catch {
    // Past sessions reference the child (FK restrict); history must stay intact.
    return fail("This child has past sessions on record, so the profile can't be removed.");
  }

  revalidatePath("/app/kids/children");
  return { ok: true as const };
}

/* -------------------------------------------------------------------------- */
/* Service Bookings                                                           */
/* -------------------------------------------------------------------------- */

export async function bookKidsServiceAction(input: unknown) {
  const parsed = bookKidsServiceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid booking input.");

  const user = await requireUser();
  const data = parsed.data;

  const result = await createKidsBooking({
    guardianUserId: user.id,
    childId: data.childId,
    serviceId: data.serviceId,
    startsAt: new Date(data.startsAt),
    deliveryMode: data.deliveryMode,
    address: data.address,
    includeMaterials: data.includeMaterials,
    paymentMode: data.paymentMode,
    clientKey: data.clientKey,
  });

  if (!result.ok) return fail(result.error);

  revalidatePath("/app/kids/bookings");
  revalidatePath(`/app/kids/services/${data.serviceId}`);
  await announceKidsRequest(result.bookingId);
  return result;
}

export async function cancelKidsBookingAction(input: unknown) {
  const parsed = cancelKidsBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid cancellation request.");

  const user = await requireUser();
  const result = await cancelKidsBooking({
    bookingId: parsed.data.bookingId,
    guardianUserId: user.id,
    reason: parsed.data.reason,
  });

  if (!result.ok) return fail(result.error);
  if (!("message" in result)) await announceKidsGuardianCancel(parsed.data.bookingId);

  revalidatePath("/app/kids/bookings");
  return result;
}

/** Provider accepts, declines, completes or cancels a kids session. */
export async function providerKidsBookingAction(input: unknown) {
  const parsed = providerKidsBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid booking update.");

  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const result = await transitionKidsBookingForProvider({
    vendorId: access.vendorId,
    bookingId: parsed.data.bookingId,
    action: parsed.data.action,
    reason: parsed.data.reason,
  });
  if (!result.ok) return fail(result.error);

  revalidatePath(`/merchant-panel/${parsed.data.slug}/bookings`);
  revalidatePath(`/merchant-panel/${parsed.data.slug}/kids`);
  revalidatePath(`/merchant-panel/${parsed.data.slug}`);
  revalidatePath("/app/kids/bookings");
  await announceKidsProviderAction(parsed.data.bookingId, parsed.data.action, parsed.data.reason);
  return { ok: true as const };
}

/* -------------------------------------------------------------------------- */
/* Workshop Enrollments                                                       */
/* -------------------------------------------------------------------------- */

export async function enrollWorkshopAction(input: unknown) {
  const parsed = enrollWorkshopSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid enrollment.");

  const user = await requireUser();
  const data = parsed.data;

  const result = await enrollInWorkshop({
    guardianUserId: user.id,
    childId: data.childId,
    workshopId: data.workshopId,
    clientKey: data.clientKey,
  });

  if (!result.ok) return fail(result.error);

  revalidatePath(`/app/kids/workshops/${data.workshopId}`);
  revalidatePath("/app/kids/bookings");
  await announceEnrollment(result.enrollmentId);
  return result;
}

export async function cancelWorkshopEnrollmentAction(input: unknown) {
  const parsed = cancelWorkshopEnrollmentSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid cancellation.");

  const user = await requireUser();
  const result = await cancelWorkshopEnrollment({
    enrollmentId: parsed.data.enrollmentId,
    guardianUserId: user.id,
    reason: parsed.data.reason,
  });

  if (!result.ok) return fail(result.error);

  revalidatePath("/app/kids/bookings");
  return result;
}

/* -------------------------------------------------------------------------- */
/* Holiday Camp Passes                                                        */
/* -------------------------------------------------------------------------- */

export async function purchasePassAction(input: unknown) {
  const parsed = purchasePassSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid pass selection.");

  const user = await requireUser();
  const clientKey = parsed.data.clientKey || `pass-buy-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await purchaseHolidayPass({
    guardianUserId: user.id,
    passId: parsed.data.passId,
    clientKey,
  });

  if (!result.ok) return fail(result.error);

  revalidatePath("/app/kids/passes");
  return result;
}

export async function redeemPassCreditAction(input: unknown) {
  const parsed = redeemPassSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid pass redemption request.");

  const user = await requireUser();
  const result = await redeemPassCredit({
    guardianUserId: user.id,
    purchaseId: parsed.data.purchaseId,
    bookingId: parsed.data.bookingId,
    enrollmentId: parsed.data.enrollmentId,
    clientKey: parsed.data.clientKey,
  });

  if (!result.ok) return fail(result.error);

  revalidatePath("/app/kids/passes");
  revalidatePath("/app/kids/bookings");
  return result;
}

/* -------------------------------------------------------------------------- */
/* Guardian Consent Recording                                                 */
/* -------------------------------------------------------------------------- */

export async function recordConsentAction(input: unknown) {
  const parsed = saveConsentSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid consent submission.");

  const user = await requireUser();
  return recordGuardianConsent({
    guardianUserId: user.id,
    childId: parsed.data.childId,
    consentType: parsed.data.consentType,
    policyVersion: parsed.data.policyVersion,
  });
}

/* -------------------------------------------------------------------------- */
/* Activity Reviews (Completed Only)                                          */
/* -------------------------------------------------------------------------- */

export async function submitKidsReviewAction(input: unknown) {
  const parsed = submitKidsReviewSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid review.");

  const user = await requireUser();
  const db = getDb();
  const data = parsed.data;

  // Only a guardian whose session with this provider is completed may review it, once.
  const eligible = data.bookingId
    ? await db
        .select({ status: kidsServiceBookings.bookingStatus })
        .from(kidsServiceBookings)
        .where(
          and(
            eq(kidsServiceBookings.id, data.bookingId),
            eq(kidsServiceBookings.guardianUserId, user.id),
            eq(kidsServiceBookings.vendorId, data.vendorId)
          )
        )
        .limit(1)
        .then(([b]) => Boolean(b && isReviewEligible(b.status)))
    : await db
        .select({ endDate: kidsWorkshops.endDate })
        .from(kidsWorkshopEnrollments)
        .innerJoin(kidsWorkshops, eq(kidsWorkshopEnrollments.workshopId, kidsWorkshops.id))
        .where(
          and(
            eq(kidsWorkshopEnrollments.id, data.enrollmentId!),
            eq(kidsWorkshopEnrollments.guardianUserId, user.id),
            eq(kidsWorkshopEnrollments.status, "confirmed"),
            eq(kidsWorkshops.vendorId, data.vendorId)
          )
        )
        .limit(1)
        .then(([e]) => Boolean(e && e.endDate < todayIST()));
  if (!eligible) return fail("You can review once the session is completed.");

  const [existing] = await db
    .select({ id: kidsReviews.id })
    .from(kidsReviews)
    .where(
      and(
        eq(kidsReviews.guardianUserId, user.id),
        data.bookingId ? eq(kidsReviews.bookingId, data.bookingId) : eq(kidsReviews.enrollmentId, data.enrollmentId!)
      )
    )
    .limit(1);
  if (existing) return fail("You have already reviewed this session.");

  let review: { id: string } | undefined;
  try {
    [review] = await db
      .insert(kidsReviews)
      .values({
        guardianUserId: user.id,
        vendorId: data.vendorId,
        bookingId: data.bookingId || null,
        enrollmentId: data.enrollmentId || null,
        rating: data.rating,
        reviewText: data.reviewText || null,
        moderationStatus: "published",
      })
      .returning({ id: kidsReviews.id });
  } catch {
    // Unique index (migration 0015) catches a concurrent double submit.
    return fail("You have already reviewed this session.");
  }

  revalidatePath("/app/kids");
  return { ok: true as const, reviewId: review!.id };
}

/* -------------------------------------------------------------------------- */
/* Provider Workspace Actions (Merchant Scoped)                              */
/* -------------------------------------------------------------------------- */

export async function saveKidsServiceAction(input: unknown) {
  const parsed = saveKidsServiceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid service.");

  const data = parsed.data;
  const access = await requireVendorAccess(data.slug, ["owner"]);
  if (access.vendor.vendorType !== "kids") return { ok: false as const, error: "Only kids academies can list kids classes" };
  const db = getDb();

  const pricePaise = rupeesToPaise(data.priceRupees);
  const materialFeePaise = rupeesToPaise(data.materialFeeRupees);
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (data.id) {
    // Update existing
    await db
      .update(kidsServices)
      .set({
        categoryId: data.categoryId,
        title: data.title,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        minAge: data.minAge,
        maxAge: data.maxAge,
        suitableClasses: data.suitableClasses,
        durationMinutes: data.durationMinutes,
        deliveryModes: data.deliveryModes,
        pricePaise,
        materialFeePolicy: data.materialFeePolicy,
        materialFeePaise,
        updatedAt: new Date(),
      })
      .where(and(eq(kidsServices.id, data.id), eq(kidsServices.vendorId, access.vendorId)));

    revalidatePath(`/merchant-panel/${data.slug}/kids`);
    return { ok: true as const, serviceId: data.id };
  }

  // Create new service
  const [created] = await db
    .insert(kidsServices)
    .values({
      vendorId: access.vendorId,
      categoryId: data.categoryId,
      title: data.title,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      minAge: data.minAge,
      maxAge: data.maxAge,
      suitableClasses: data.suitableClasses,
      durationMinutes: data.durationMinutes,
      deliveryModes: data.deliveryModes,
      pricePaise,
      materialFeePolicy: data.materialFeePolicy,
      materialFeePaise,
    })
    .returning({ id: kidsServices.id });

  revalidatePath(`/merchant-panel/${data.slug}/kids`);
  return { ok: true as const, serviceId: created!.id };
}

export async function archiveKidsServiceAction(input: { slug: string; serviceId: string }) {
  const access = await requireVendorAccess(input.slug, ["owner"]);
  const db = getDb();

  await db
    .update(kidsServices)
    .set({
      isActive: false,
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(kidsServices.id, input.serviceId), eq(kidsServices.vendorId, access.vendorId)));

  revalidatePath(`/merchant-panel/${input.slug}/kids`);
  return { ok: true as const };
}

export async function saveKidsWorkshopAction(input: unknown) {
  const parsed = saveKidsWorkshopSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid workshop details.");

  const data = parsed.data;
  const access = await requireVendorAccess(data.slug, ["owner"]);
  if (access.vendor.vendorType !== "kids") return { ok: false as const, error: "Only kids academies can list kids classes" };
  const db = getDb();

  const pricePaise = rupeesToPaise(data.priceRupees);
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (data.id) {
    await db
      .update(kidsWorkshops)
      .set({
        categoryId: data.categoryId,
        title: data.title,
        description: data.description || null,
        minAge: data.minAge,
        maxAge: data.maxAge,
        eligibleClasses: data.eligibleClasses,
        startDate: data.startDate,
        endDate: data.endDate,
        enrollmentDeadline: new Date(data.enrollmentDeadline),
        venueOrMode: data.venueOrMode,
        address: data.address || null,
        capacity: data.capacity,
        pricePaise,
        materialsDescription: data.materialsDescription || null,
        publicationState: data.publicationState,
        cancellationPolicy: data.cancellationPolicy || "Standard cancellation policy applies.",
        updatedAt: new Date(),
      })
      .where(and(eq(kidsWorkshops.id, data.id), eq(kidsWorkshops.vendorId, access.vendorId)));

    revalidatePath(`/merchant-panel/${data.slug}/kids`);
    return { ok: true as const, workshopId: data.id };
  }

  const [created] = await db
    .insert(kidsWorkshops)
    .values({
      vendorId: access.vendorId,
      categoryId: data.categoryId,
      title: data.title,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      description: data.description || null,
      minAge: data.minAge,
      maxAge: data.maxAge,
      eligibleClasses: data.eligibleClasses,
      startDate: data.startDate,
      endDate: data.endDate,
      enrollmentDeadline: new Date(data.enrollmentDeadline),
      venueOrMode: data.venueOrMode,
      address: data.address || null,
      capacity: data.capacity,
      pricePaise,
      materialsDescription: data.materialsDescription || null,
      publicationState: data.publicationState,
      cancellationPolicy: data.cancellationPolicy || "Standard cancellation policy applies.",
    })
    .returning({ id: kidsWorkshops.id });

  revalidatePath(`/merchant-panel/${data.slug}/kids`);
  return { ok: true as const, workshopId: created!.id };
}

/* -------------------------------------------------------------------------- */
/* Admin Verification & Safety Governance                                     */
/* -------------------------------------------------------------------------- */

export async function adminVerifyProviderAction(input: unknown) {
  const parsed = adminVerifyProviderSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid verification input.");

  const { user } = await requireAdmin();
  const data = parsed.data;

  const result = await updateProviderVerification({
    adminUserId: user.id,
    vendorId: data.vendorId,
    verificationStatus: data.status,
    safetyReviewStatus: data.safetyReviewStatus,
    safetyNotes: data.safetyNotes,
  });

  revalidatePath("/admin/kids");
  return result;
}
