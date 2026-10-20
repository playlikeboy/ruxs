import { describe, expect, it } from "bun:test";
import {
  calculateRemainingCredits,
  calculateReversedCredits,
  canRedeemPass,
} from "./pass-redemption";

describe("pass redemption rules", () => {
  const baseTime = new Date("2026-10-20T10:00:00Z");
  const futureExpiry = new Date(baseTime.getTime() + 15 * 86400_000);
  const pastExpiry = new Date(baseTime.getTime() - 2 * 86400_000);

  it("checks pass redemption eligibility", () => {
    // Valid pass with 4 credits
    expect(canRedeemPass(4, futureExpiry, 1, baseTime).canRedeem).toBe(true);

    // Insufficient credits
    const insufficient = canRedeemPass(0, futureExpiry, 1, baseTime);
    expect(insufficient.canRedeem).toBe(false);
    expect(insufficient.reason).toContain("Insufficient");

    // Expired pass
    const expired = canRedeemPass(5, pastExpiry, 1, baseTime);
    expect(expired.canRedeem).toBe(false);
    expect(expired.reason).toContain("expired");

    // Invalid credits requested
    expect(canRedeemPass(5, futureExpiry, 0, baseTime).canRedeem).toBe(false);
  });

  it("calculates remaining credits safely without negatives", () => {
    expect(calculateRemainingCredits(5, 1)).toBe(4);
    expect(calculateRemainingCredits(1, 1)).toBe(0);
    expect(calculateRemainingCredits(1, 3)).toBe(0); // clamps at 0
    expect(calculateRemainingCredits(4, -1)).toBe(4);
  });

  it("calculates reversed credits after cancellation without exceeding purchased ceiling", () => {
    expect(calculateReversedCredits(2, 1, 4)).toBe(3);
    expect(calculateReversedCredits(4, 1, 4)).toBe(4); // capped at purchased credits
    expect(calculateReversedCredits(1, 0, 4)).toBe(1);
  });
});
