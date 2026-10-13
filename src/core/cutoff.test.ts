import { describe, it, expect } from "bun:test";
import { isLate, lateCharge } from "./cutoff";
import { istDateTime } from "./time";

describe("cutoff rules", () => {
  it("determines lateness based on tap time vs IST cutoff", () => {
    const serviceDate = "2026-10-14";
    const cutoffAt = "10:00:00";

    // 09:59:59 IST - not late
    const onTime = istDateTime(serviceDate, "09:59:59");
    expect(isLate(onTime, serviceDate, cutoffAt)).toBe(false);

    // Exactly 10:00:00 IST - not late (on time)
    const exact = istDateTime(serviceDate, "10:00:00");
    expect(isLate(exact, serviceDate, cutoffAt)).toBe(false);

    // Launch gate test: A skip at 10:00:01 is late against 10:00:00
    const oneSecondLate = istDateTime(serviceDate, "10:00:01");
    expect(isLate(oneSecondLate, serviceDate, cutoffAt)).toBe(true);
  });

  it("calculates late charges based on late_rule", () => {
    const unitPaise = 9000; // ₹90
    const qty = 2;

    // Free rule: 0 charge
    expect(lateCharge("free", qty, unitPaise)).toEqual({
      refused: false,
      chargePaise: 0,
    });

    // Full rule: 100% charge
    expect(lateCharge("full", qty, unitPaise)).toEqual({
      refused: false,
      chargePaise: 18000,
    });

    // Half rule: 50% charge rounded half up to whole paise
    expect(lateCharge("half", qty, unitPaise)).toEqual({
      refused: false,
      chargePaise: 9000,
    });

    // Half rule with odd paise rounding
    expect(lateCharge("half", 1, 95)).toEqual({
      refused: false,
      chargePaise: 48, // 95 * 0.5 = 47.5 -> rounded half up to 48
    });

    // Locked rule: refused
    expect(lateCharge("locked", qty, unitPaise)).toEqual({
      refused: true,
      chargePaise: 0,
    });
  });
});
