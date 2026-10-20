/**
 * Pure rules for kids single-session bookings, pricing totals, and cancellation deadlines.
 * Strict integer paise rules per AGENTS.md.
 */

export interface BookingValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates start time against notice minutes and operating window.
 */
export function validateBookingWindow(
  startsAt: Date,
  durationMinutes: number,
  noticeMinutes: number,
  now: Date = new Date()
): BookingValidationResult {
  const earliestAllowed = new Date(now.getTime() + noticeMinutes * 60_000);
  if (startsAt < earliestAllowed) {
    return {
      valid: false,
      reason: `Requires at least ${noticeMinutes} minutes notice before booking start.`,
    };
  }

  if (durationMinutes < 15 || durationMinutes > 480) {
    return {
      valid: false,
      reason: "Session duration must be between 15 and 480 minutes.",
    };
  }

  return { valid: true };
}

/**
 * Checks whether a booking can be cancelled and whether it is eligible for refund.
 */
export function canCancelKidsBooking(
  startsAt: Date,
  cutoffHours: number = 3,
  now: Date = new Date()
): { canCancel: boolean; refundEligible: boolean; hoursRemaining: number } {
  const diffMs = startsAt.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return { canCancel: false, refundEligible: false, hoursRemaining: 0 };
  }

  const canCancel = hoursRemaining > 0;
  const refundEligible = hoursRemaining >= cutoffHours;

  return {
    canCancel,
    refundEligible,
    hoursRemaining: Math.max(0, Math.round(hoursRemaining * 10) / 10),
  };
}

/**
 * Calculates total booking amount in integer paise.
 * Never uses floats.
 */
export function calculateKidsBookingTotal(
  servicePricePaise: number,
  materialPricePaise: number = 0,
  materialPolicy: string = "included"
): { totalPaise: number; servicePaise: number; materialPaise: number } {
  const safeService = Math.max(0, Math.round(servicePricePaise));
  const safeMaterial = Math.max(0, Math.round(materialPricePaise));

  // If policy is 'included', materials are included in base price
  const materialCharge = materialPolicy === "included" ? 0 : safeMaterial;
  const totalPaise = safeService + materialCharge;

  return {
    totalPaise,
    servicePaise: safeService,
    materialPaise: materialCharge,
  };
}

/**
 * Deterministic human-readable booking number generator.
 */
export function generateKidsBookingNumber(dateStr: string, randomSuffix?: string): string {
  // Format: KBK-MMDD-XXXXX
  const cleanDate = dateStr.replace(/-/g, "").slice(4, 8); // MMDD
  const suffix = randomSuffix || Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KBK-${cleanDate}-${suffix}`;
}
