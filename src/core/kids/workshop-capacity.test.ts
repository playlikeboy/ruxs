import { describe, expect, it } from "bun:test";
import {
  calculateWorkshopAvailability,
  canEnrollInWorkshop,
} from "./workshop-capacity";

describe("workshop capacity rules", () => {
  const baseTime = new Date("2026-10-20T10:00:00Z");
  const futureDeadline = new Date(baseTime.getTime() + 24 * 3600_000);
  const pastDeadline = new Date(baseTime.getTime() - 2 * 3600_000);

  it("calculates remaining capacity and urgency states", () => {
    // 10 capacity, 4 enrolled => 6 remaining
    const normal = calculateWorkshopAvailability(10, 4);
    expect(normal.available).toBe(true);
    expect(normal.remainingSeats).toBe(6);
    expect(normal.isAlmostFull).toBe(false);
    expect(normal.isFull).toBe(false);

    // 8 capacity, 7 enrolled => 1 remaining (urgent)
    const urgent = calculateWorkshopAvailability(8, 7);
    expect(urgent.available).toBe(true);
    expect(urgent.remainingSeats).toBe(1);
    expect(urgent.isAlmostFull).toBe(true);
    expect(urgent.label).toBe("Only 1 seat left!");

    // 12 capacity, 12 enrolled => Full
    const full = calculateWorkshopAvailability(12, 12);
    expect(full.available).toBe(false);
    expect(full.remainingSeats).toBe(0);
    expect(full.isFull).toBe(true);
    expect(full.label).toBe("Workshop Full");
  });

  it("evaluates enrollment eligibility against deadlines and seat limits", () => {
    // Open workshop before deadline
    expect(canEnrollInWorkshop(10, 5, futureDeadline, baseTime).canEnroll).toBe(true);

    // Past deadline
    const expired = canEnrollInWorkshop(10, 5, pastDeadline, baseTime);
    expect(expired.canEnroll).toBe(false);
    expect(expired.reason).toContain("deadline");

    // Full workshop
    const full = canEnrollInWorkshop(8, 8, futureDeadline, baseTime);
    expect(full.canEnroll).toBe(false);
    expect(full.reason).toContain("maximum capacity");
  });
});
