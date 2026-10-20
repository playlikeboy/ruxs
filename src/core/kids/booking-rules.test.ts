import { describe, expect, it } from "bun:test";
import {
  calculateKidsBookingTotal,
  canCancelKidsBooking,
  generateKidsBookingNumber,
  validateBookingWindow,
} from "./booking-rules";

describe("kids booking rules", () => {
  const baseTime = new Date("2026-10-20T10:00:00Z");

  it("validates booking advance notice correctly", () => {
    // 2 hours notice required
    const sessionIn3Hours = new Date(baseTime.getTime() + 3 * 3600_000);
    const sessionIn30Mins = new Date(baseTime.getTime() + 30 * 60_000);

    const validRes = validateBookingWindow(sessionIn3Hours, 60, 120, baseTime);
    expect(validRes.valid).toBe(true);

    const tooEarly = validateBookingWindow(sessionIn30Mins, 60, 120, baseTime);
    expect(tooEarly.valid).toBe(false);
    expect(tooEarly.reason).toContain("notice");

    // Invalid duration
    const badDuration = validateBookingWindow(sessionIn3Hours, 10, 120, baseTime);
    expect(badDuration.valid).toBe(false);
  });

  it("handles cancellation cutoff and refund eligibility", () => {
    // 5 hours away: cancel allowed with full refund
    const futureSession = new Date(baseTime.getTime() + 5 * 3600_000);
    const cancelOk = canCancelKidsBooking(futureSession, 3, baseTime);
    expect(cancelOk.canCancel).toBe(true);
    expect(cancelOk.refundEligible).toBe(true);

    // 1 hour away: cancel allowed but no refund (past cutoff)
    const lateSession = new Date(baseTime.getTime() + 1 * 3600_000);
    const cancelLate = canCancelKidsBooking(lateSession, 3, baseTime);
    expect(cancelLate.canCancel).toBe(true);
    expect(cancelLate.refundEligible).toBe(false);

    // Past session: cannot cancel
    const pastSession = new Date(baseTime.getTime() - 1 * 3600_000);
    const cancelPast = canCancelKidsBooking(pastSession, 3, baseTime);
    expect(cancelPast.canCancel).toBe(false);
  });

  it("calculates booking totals in integer paise without floating point issues", () => {
    // Included materials
    const incl = calculateKidsBookingTotal(50000, 15000, "included");
    expect(incl.totalPaise).toBe(50000);
    expect(incl.materialPaise).toBe(0);

    // Extra materials
    const extra = calculateKidsBookingTotal(50000, 15000, "extra");
    expect(extra.totalPaise).toBe(65000);
    expect(extra.materialPaise).toBe(15000);

    // Required materials
    const req = calculateKidsBookingTotal(69900, 25000, "required");
    expect(req.totalPaise).toBe(94900);
  });

  it("generates formatted booking numbers", () => {
    const num = generateKidsBookingNumber("2026-10-20", "TEST1");
    expect(num).toBe("KBK-1020-TEST1");
  });
});
