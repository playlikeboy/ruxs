import { describe, it, expect } from "bun:test";
import { canCancelBooking, isValidRule, openSlots, overlaps, rulesOverlap } from "./booking";
import { istDateTime } from "./time";

// 2026-10-19 is a Monday.
const MON = "2026-10-19";
const rules = [{ weekday: "mon", startTime: "06:00", endTime: "08:00" }];
const early = istDateTime("2026-10-18", "12:00"); // the day before

describe("open slots", () => {
  it("steps every 30 minutes and keeps the session inside the window", () => {
    const slots = openSlots({ date: MON, rules, busy: [], durationMinutes: 60, noticeMinutes: 0, now: early });
    expect(slots.map((d) => d.toISOString())).toEqual([
      istDateTime(MON, "06:00").toISOString(),
      istDateTime(MON, "06:30").toISOString(),
      istDateTime(MON, "07:00").toISOString(),
    ]);
  });

  it("skips times that overlap a booking or time off", () => {
    const busy = [{ startsAt: istDateTime(MON, "06:30"), endsAt: istDateTime(MON, "07:30") }];
    const slots = openSlots({ date: MON, rules, busy, durationMinutes: 30, noticeMinutes: 0, now: early });
    expect(slots.map((d) => d.toISOString())).toEqual([istDateTime(MON, "06:00").toISOString(), istDateTime(MON, "07:30").toISOString()]);
  });

  it("respects minimum notice and the weekday", () => {
    const now = istDateTime(MON, "05:30");
    const slots = openSlots({ date: MON, rules, busy: [], durationMinutes: 60, noticeMinutes: 60, now });
    expect(slots[0]!.toISOString()).toBe(istDateTime(MON, "06:30").toISOString());
    expect(openSlots({ date: "2026-10-20", rules, busy: [], durationMinutes: 60, noticeMinutes: 0, now: early })).toEqual([]);
  });

  it("returns nothing for silly durations", () => {
    expect(openSlots({ date: MON, rules, busy: [], durationMinutes: 5, noticeMinutes: 0, now: early })).toEqual([]);
  });
});

describe("rules and overlaps", () => {
  it("validates windows", () => {
    expect(isValidRule({ weekday: "mon", startTime: "06:00", endTime: "05:00" })).toBe(false);
    expect(isValidRule({ weekday: "mon", startTime: "6:00", endTime: "08:00" })).toBe(false);
  });

  it("detects overlapping windows on the same day only", () => {
    expect(rulesOverlap([{ weekday: "mon", startTime: "06:00", endTime: "09:00" }, { weekday: "mon", startTime: "08:00", endTime: "10:00" }])).toBe(true);
    expect(rulesOverlap([{ weekday: "mon", startTime: "06:00", endTime: "09:00" }, { weekday: "tue", startTime: "08:00", endTime: "10:00" }])).toBe(false);
  });

  it("treats touching sessions as not overlapping", () => {
    const a = { startsAt: istDateTime(MON, "06:00"), endsAt: istDateTime(MON, "07:00") };
    const b = { startsAt: istDateTime(MON, "07:00"), endsAt: istDateTime(MON, "08:00") };
    expect(overlaps(a, b)).toBe(false);
  });
});

describe("cancel cutoff", () => {
  it("allows cancelling only before the cutoff", () => {
    const start = istDateTime(MON, "10:00");
    expect(canCancelBooking(start, istDateTime(MON, "07:00"), 3)).toBe(true);
    expect(canCancelBooking(start, istDateTime(MON, "07:01"), 3)).toBe(false);
  });
});
