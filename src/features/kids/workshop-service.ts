import "server-only";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  kidsChildren,
  kidsProviderProfiles,
  kidsWorkshopEnrollments,
  kidsWorkshops,
  vendors,
} from "@/db/schema";
import { canEnrollInWorkshop } from "@/core/kids/workshop-capacity";
import { calculateAge, isAgeEligible, isClassEligible } from "@/core/kids/age-eligibility";

export interface EnrollWorkshopInput {
  guardianUserId: string;
  childId: string;
  workshopId: string;
  clientKey: string;
}

export async function enrollInWorkshop(input: EnrollWorkshopInput) {
  const db = getDb();

  // 1. Validate child belongs to guardian
  const [child] = await db
    .select()
    .from(kidsChildren)
    .where(and(eq(kidsChildren.id, input.childId), eq(kidsChildren.guardianUserId, input.guardianUserId)))
    .limit(1);

  if (!child) {
    return { ok: false as const, error: "Child profile not found." };
  }

  // 2. Validate workshop exists and is published
  const [workshop] = await db
    .select({
      workshop: kidsWorkshops,
      vendor: vendors,
    })
    .from(kidsWorkshops)
    .innerJoin(vendors, eq(kidsWorkshops.vendorId, vendors.id))
    .innerJoin(kidsProviderProfiles, eq(kidsProviderProfiles.vendorId, vendors.id))
    .where(
      and(
        eq(kidsWorkshops.id, input.workshopId),
        eq(kidsWorkshops.publicationState, "published"),
        eq(vendors.status, "active"),
        eq(kidsProviderProfiles.verificationStatus, "approved"),
        eq(kidsProviderProfiles.safetyReviewStatus, "passed")
      )
    )
    .limit(1);

  if (!workshop) {
    return { ok: false as const, error: "Workshop is not available." };
  }

  const { workshop: ws } = workshop;

  // 3. Validate age & class
  const childAge = calculateAge(child.birthDate || child.birthYear);
  if (childAge > 0 && !isAgeEligible(childAge, ws.minAge, ws.maxAge)) {
    return {
      ok: false as const,
      error: `Child must be between ${ws.minAge} and ${ws.maxAge} years old for this workshop.`,
    };
  }

  if (child.schoolClass && ws.eligibleClasses.length > 0) {
    if (!isClassEligible(child.schoolClass, ws.eligibleClasses)) {
      return {
        ok: false as const,
        error: `Workshop is open to: ${ws.eligibleClasses.join(", ")}.`,
      };
    }
  }

  // 4. Concurrency-safe capacity check and atomic enrollment
  try {
    const result = await db.transaction(async (tx) => {
      // Transaction-level advisory lock per workshop to prevent concurrent overbooking
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${ws.id}))`);

      // Check if child already enrolled
      const [alreadyEnrolled] = await tx
        .select({ id: kidsWorkshopEnrollments.id, status: kidsWorkshopEnrollments.status })
        .from(kidsWorkshopEnrollments)
        .where(
          and(
            eq(kidsWorkshopEnrollments.workshopId, ws.id),
            eq(kidsWorkshopEnrollments.childId, child.id),
            inArray(kidsWorkshopEnrollments.status, ["pending", "confirmed"])
          )
        )
        .limit(1);

      if (alreadyEnrolled) {
        throw new Error("This child is already enrolled in this workshop.");
      }

      // Count existing active enrollments
      const [enrolledCountRow] = await tx
        .select({ count: count() })
        .from(kidsWorkshopEnrollments)
        .where(
          and(
            eq(kidsWorkshopEnrollments.workshopId, ws.id),
            inArray(kidsWorkshopEnrollments.status, ["pending", "confirmed"])
          )
        );

      const enrolledCount = Number(enrolledCountRow?.count ?? 0);
      const enrollmentCheck = canEnrollInWorkshop(ws.capacity, enrolledCount, ws.enrollmentDeadline);

      if (!enrollmentCheck.canEnroll) {
        throw new Error(enrollmentCheck.reason || "Workshop is full or registration is closed.");
      }

      const [enrollment] = await tx
        .insert(kidsWorkshopEnrollments)
        .values({
          workshopId: ws.id,
          childId: child.id,
          guardianUserId: input.guardianUserId,
          // Seat is reserved; workshops are paid at the venue (no online checkout yet).
          status: "confirmed",
          priceSnapshotPaise: ws.pricePaise,
          paymentStatus: "unpaid",
        })
        .returning({ id: kidsWorkshopEnrollments.id });

      return enrollment;
    });

    return { ok: true as const, enrollmentId: result!.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete enrollment.";
    return { ok: false as const, error: message };
  }
}

export async function cancelWorkshopEnrollment(input: {
  enrollmentId: string;
  guardianUserId: string;
  reason?: string;
}) {
  const db = getDb();

  const [enrollment] = await db
    .select({
      id: kidsWorkshopEnrollments.id,
      workshopId: kidsWorkshopEnrollments.workshopId,
      status: kidsWorkshopEnrollments.status,
      paymentStatus: kidsWorkshopEnrollments.paymentStatus,
    })
    .from(kidsWorkshopEnrollments)
    .where(
      and(
        eq(kidsWorkshopEnrollments.id, input.enrollmentId),
        eq(kidsWorkshopEnrollments.guardianUserId, input.guardianUserId)
      )
    )
    .limit(1);

  if (!enrollment) {
    return { ok: false as const, error: "Enrollment not found." };
  }

  if (enrollment.status === "cancelled") {
    return { ok: true as const, message: "Already cancelled." };
  }

  const nextPaymentStatus =
    enrollment.paymentStatus === "paid" ? "refund_due" : enrollment.paymentStatus;

  const cancelled = await db
    .update(kidsWorkshopEnrollments)
    .set({
      status: "cancelled",
      paymentStatus: nextPaymentStatus,
      cancellationReason: input.reason || "Cancelled by guardian",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(kidsWorkshopEnrollments.id, enrollment.id), eq(kidsWorkshopEnrollments.status, enrollment.status)))
    .returning({ id: kidsWorkshopEnrollments.id });
  if (cancelled.length === 0) return { ok: false as const, error: "This enrollment just changed. Refresh and try again." };

  return { ok: true as const };
}
