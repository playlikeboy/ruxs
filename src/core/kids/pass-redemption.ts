/**
 * Pure rules for holiday activity passes and credit redemption.
 * Strictly integer credits; never allows negative balance.
 */

export interface PassRedemptionEligibility {
  canRedeem: boolean;
  reason?: string;
}

/**
 * Checks whether credits can be redeemed from a pass purchase.
 */
export function canRedeemPass(
  remainingCredits: number,
  validUntil: Date,
  creditsNeeded: number = 1,
  now: Date = new Date()
): PassRedemptionEligibility {
  if (creditsNeeded <= 0) {
    return { canRedeem: false, reason: "Credits needed must be at least 1." };
  }

  if (now > validUntil) {
    return { canRedeem: false, reason: "This pass has expired." };
  }

  if (remainingCredits < creditsNeeded) {
    return {
      canRedeem: false,
      reason: `Insufficient credits. Pass has ${remainingCredits} remaining, but ${creditsNeeded} needed.`,
    };
  }

  return { canRedeem: true };
}

/**
 * Calculates new remaining credits after redemption.
 * Clamps strictly at 0.
 */
export function calculateRemainingCredits(currentRemaining: number, creditsToDeduct: number): number {
  if (creditsToDeduct <= 0) return currentRemaining;
  return Math.max(0, currentRemaining - creditsToDeduct);
}

/**
 * Calculates new remaining credits after a cancellation/reversal.
 * Clamps at purchased total.
 */
export function calculateReversedCredits(
  currentRemaining: number,
  creditsToRefund: number,
  purchasedCredits: number
): number {
  if (creditsToRefund <= 0) return currentRemaining;
  return Math.min(purchasedCredits, currentRemaining + creditsToRefund);
}
