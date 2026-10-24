import { describe, expect, it } from "bun:test";
import { isEveningReminderWindow, tomorrowRangeIST } from "./reminders";

describe("reminder timing", () => {
  it("opens for the first ten minutes after 18:00 IST", () => {
    expect(isEveningReminderWindow(new Date("2026-10-25T18:00:00+05:30"))).toBe(true);
    expect(isEveningReminderWindow(new Date("2026-10-25T18:09:59+05:30"))).toBe(true);
    expect(isEveningReminderWindow(new Date("2026-10-25T18:10:00+05:30"))).toBe(false);
    expect(isEveningReminderWindow(new Date("2026-10-25T17:59:00+05:30"))).toBe(false);
  });

  it("covers all of tomorrow in IST", () => {
    const { from, until, date } = tomorrowRangeIST(new Date("2026-10-25T18:02:00+05:30"));
    expect(date).toBe("2026-10-26");
    expect(from.toISOString()).toBe("2026-10-25T18:30:00.000Z");
    expect(until.toISOString()).toBe("2026-10-26T18:30:00.000Z");
  });
});
