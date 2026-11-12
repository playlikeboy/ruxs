import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  kidsPassPurchases,
  kidsPassRedemptions,
  kidsServiceBookings,
  kidsWorkshopEnrollments,
} from "@/db/schema";
import {
  calculateRemainingCredits,
  calculateReversedCredits,
  canRedeemPass,
} from "@/core/kids/pass-redemption";

/** A rule the guardian can act on; its message is safe to show. */
class PassRuleError extends Error {}

/**
 * Pass purchases are closed until passes are wired to verified online payment.
 * Never grant paid credits without a captured payment.
 */
export async function purchaseHolidayPass(_input: {
  guardianUserId: string;
  passId: string;
  clientKey: string;
}) {
  return { ok: false as const, error: "Online checkout for holiday passes opens soon. Book single sessions for now." };
}

export async function redeemPassCredit(input: {
  guardianUserId: string;
  purchaseId: string;
  bookingId?: string;
  enrollmentId?: string;
  clientKey: string;
  creditsToDeduct?: number;
}) {
  const db = getDb();
  const creditsNeeded = input.creditsToDeduct ?? 1;

  // Check idempotency first, only among this guardian's own passes.
  const [already] = await db
    .select({ id: kidsPassRedemptions.id, status: kidsPassRedemptions.status })
    .from(kidsPassRedemptions)
    .innerJoin(kidsPassPurchases, eq(kidsPassRedemptions.purchaseId, kidsPassPurchases.id))
    .where(and(eq(kidsPassRedemptions.idempotencyKey, input.clientKey), eq(kidsPassPurchases.guardianUserId, input.guardianUserId)))
    .limit(1);

  if (already) {
    return { ok: true as const, redemptionId: already.id, status: already.status };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Lock pass purchase row for update
      const [purchase] = await tx
        .select()
        .from(kidsPassPurchases)
        .where(
          and(
            eq(kidsPassPurchases.id, input.purchaseId),
            eq(kidsPassPurchases.guardianUserId, input.guardianUserId)
          )
        )
        .for("update")
        .limit(1);

      if (!purchase) {
        throw new PassRuleError("Pass purchase not found or does not belong to you.");
      }

      // The session a credit pays for must also be this guardian's.
      if (input.bookingId) {
        const [own] = await tx
          .select({ id: kidsServiceBookings.id })
          .from(kidsServiceBookings)
          .where(and(eq(kidsServiceBookings.id, input.bookingId), eq(kidsServiceBookings.guardianUserId, input.guardianUserId)))
          .limit(1);
        if (!own) throw new PassRuleError("Booking not found.");
      }
      if (input.enrollmentId) {
        const [own] = await tx
          .select({ id: kidsWorkshopEnrollments.id })
          .from(kidsWorkshopEnrollments)
          .where(and(eq(kidsWorkshopEnrollments.id, input.enrollmentId), eq(kidsWorkshopEnrollments.guardianUserId, input.guardianUserId)))
          .limit(1);
        if (!own) throw new PassRuleError("Workshop enrollment not found.");
      }

      const eligibility = canRedeemPass(purchase.remainingCredits, purchase.validUntil, creditsNeeded);
      if (!eligibility.canRedeem) {
        throw new PassRuleError(eligibility.reason || "Cannot redeem pass credits.");
      }

      const newRemaining = calculateRemainingCredits(purchase.remainingCredits, creditsNeeded);

      await tx
        .update(kidsPassPurchases)
        .set({ remainingCredits: newRemaining })
        .where(eq(kidsPassPurchases.id, purchase.id));

      const [redemption] = await tx
        .insert(kidsPassRedemptions)
        .values({
          purchaseId: purchase.id,
          bookingId: input.bookingId || null,
          enrollmentId: input.enrollmentId || null,
          creditsConsumed: creditsNeeded,
          idempotencyKey: input.clientKey,
          status: "redeemed",
        })
        .returning({ id: kidsPassRedemptions.id });

      return redemption;
    });

    return { ok: true as const, redemptionId: result!.id };
  } catch (err: unknown) {
    if (err instanceof PassRuleError) return { ok: false as const, error: err.message };
    console.error("redeemPassCredit failed", err);
    return { ok: false as const, error: "Could not use the pass credit. Please try again." };
  }
}

export async function reversePassCredit(input: {
  redemptionId: string;
  guardianUserId: string;
}) {
  const db = getDb();

  try {
    await db.transaction(async (tx) => {
      const [redemption] = await tx
        .select()
        .from(kidsPassRedemptions)
        .where(eq(kidsPassRedemptions.id, input.redemptionId))
        .for("update")
        .limit(1);

      if (!redemption || redemption.status === "reversed") return;

      const [purchase] = await tx
        .select()
        .from(kidsPassPurchases)
        .where(
          and(
            eq(kidsPassPurchases.id, redemption.purchaseId),
            eq(kidsPassPurchases.guardianUserId, input.guardianUserId)
          )
        )
        .for("update")
        .limit(1);

      if (!purchase) throw new PassRuleError("Pass purchase not found or does not belong to you.");

      const newRemaining = calculateReversedCredits(
        purchase.remainingCredits,
        redemption.creditsConsumed,
        purchase.purchasedCredits
      );

      await tx
        .update(kidsPassPurchases)
        .set({ remainingCredits: newRemaining })
        .where(eq(kidsPassPurchases.id, purchase.id));

      await tx
        .update(kidsPassRedemptions)
        .set({ status: "reversed" })
        .where(eq(kidsPassRedemptions.id, redemption.id));
    });

    return { ok: true as const };
  } catch (err: unknown) {
    if (err instanceof PassRuleError) return { ok: false as const, error: err.message };
    console.error("reversePassCredit failed", err);
    return { ok: false as const, error: "Could not return the pass credit. Please try again." };
  }
}
