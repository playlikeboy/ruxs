/** Store ratings: 1–5 stars, one per household per store. */

export interface RatingSummary {
  average: number | null; // one decimal, null when no ratings yet
  count: number;
}

export function isValidRating(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export function summarizeRatings(ratings: number[]): RatingSummary {
  const valid = ratings.filter(isValidRating);
  if (valid.length === 0) return { average: null, count: 0 };
  const sum = valid.reduce((a, b) => a + b, 0);
  return { average: Math.round((sum / valid.length) * 10) / 10, count: valid.length };
}

/** From SQL aggregates (sum and count) without loading every row. */
export function summaryFromTotals(sum: number, count: number): RatingSummary {
  if (count <= 0) return { average: null, count: 0 };
  return { average: Math.round((sum / count) * 10) / 10, count };
}

/**
 * A household may rate a store once it has really used it: a delivered app
 * order, or a plan that has started.
 */
export function canReview(input: { deliveredOrders: number; startedPlans: number }): boolean {
  return input.deliveredOrders > 0 || input.startedPlans > 0;
}
