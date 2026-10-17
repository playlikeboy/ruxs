import { describe, it, expect } from "bun:test";
import { canReview, isValidRating, summarizeRatings, summaryFromTotals } from "./ratings";

describe("ratings", () => {
  it("averages to one decimal and ignores invalid values", () => {
    expect(summarizeRatings([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
    expect(summarizeRatings([5, 0, 6, 3.5])).toEqual({ average: 5, count: 1 });
    expect(summarizeRatings([])).toEqual({ average: null, count: 0 });
  });

  it("builds the same summary from SQL totals", () => {
    expect(summaryFromTotals(13, 3)).toEqual({ average: 4.3, count: 3 });
    expect(summaryFromTotals(0, 0)).toEqual({ average: null, count: 0 });
  });

  it("only accepts whole stars 1 to 5", () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(4.5)).toBe(false);
  });

  it("lets only real customers review", () => {
    expect(canReview({ deliveredOrders: 0, startedPlans: 0 })).toBe(false);
    expect(canReview({ deliveredOrders: 1, startedPlans: 0 })).toBe(true);
    expect(canReview({ deliveredOrders: 0, startedPlans: 1 })).toBe(true);
    expect(canReview({ deliveredOrders: 0, startedPlans: 0, completedSessions: 1 })).toBe(true);
  });
});
