import { describe, it, expect } from "bun:test";
import { todayIST, istDateTime, weekdayIST } from "./time";

describe("time rules (Asia/Kolkata)", () => {
  it("determines today's date in IST", () => {
    // 2026-10-14 00:30:00 UTC is 2026-10-14 06:00:00 IST
    const date1 = new Date("2026-10-14T00:30:00Z");
    expect(todayIST(date1)).toBe("2026-10-14");

    // 2026-10-13 23:00:00 UTC is 2026-10-14 04:30:00 IST (crossed midnight in India)
    const date2 = new Date("2026-10-13T23:00:00Z");
    expect(todayIST(date2)).toBe("2026-10-14");
  });

  it("constructs exact UTC moment from serviceDate and IST time", () => {
    // 10:00:00 IST is 04:30:00 UTC
    const d = istDateTime("2026-10-14", "10:00:00");
    expect(d.toISOString()).toBe("2026-10-14T04:30:00.000Z");

    // Works with HH:MM format
    const d2 = istDateTime("2026-10-14", "10:00");
    expect(d2.toISOString()).toBe("2026-10-14T04:30:00.000Z");
  });

  it("returns lowercase weekday in IST", () => {
    expect(weekdayIST("2026-10-12")).toBe("mon");
    expect(weekdayIST("2026-10-13")).toBe("tue");
    expect(weekdayIST("2026-10-14")).toBe("wed");
    expect(weekdayIST("2026-10-18")).toBe("sun");
  });
});
