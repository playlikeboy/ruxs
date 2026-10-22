import { describe, expect, it } from "bun:test";
import { gridHours, hhmmToMinutes, istMinutes, layoutLanes, parseDateParam, weekDates, weekStartIST } from "./calendar";
import { istDateTime } from "./time";

describe("calendar", () => {
  it("reads IST minutes from a UTC instant", () => {
    expect(istMinutes(istDateTime("2026-10-22", "06:30"))).toBe(390);
    expect(istMinutes(istDateTime("2026-10-22", "00:00"))).toBe(0);
    expect(istMinutes(istDateTime("2026-10-22", "23:59"))).toBe(1439);
  });

  it("finds the Monday of the week", () => {
    expect(weekStartIST("2026-10-22")).toBe("2026-10-19"); // Thursday → Monday
    expect(weekStartIST("2026-10-19")).toBe("2026-10-19");
    expect(weekStartIST("2026-10-25")).toBe("2026-10-19"); // Sunday
    expect(weekDates("2026-10-19")).toHaveLength(7);
    expect(weekDates("2026-10-19")[6]).toBe("2026-10-25");
  });

  it("parses date params safely", () => {
    expect(parseDateParam("2026-01-05")).toBe("2026-01-05");
    expect(parseDateParam("nope", istDateTime("2026-10-22", "10:00"))).toBe("2026-10-22");
    expect(parseDateParam(undefined, istDateTime("2026-10-22", "10:00"))).toBe("2026-10-22");
  });

  it("sizes the grid to hours and events", () => {
    expect(gridHours([], [])).toEqual({ from: 7, to: 21 });
    expect(gridHours([{ startTime: "05:30", endTime: "10:00" }], [])).toEqual({ from: 5, to: 21 });
    expect(gridHours([{ startTime: "08:00", endTime: "22:30" }], [{ start: hhmmToMinutes("06:00"), end: 400 }])).toEqual({ from: 6, to: 23 });
  });

  it("puts overlapping events side by side", () => {
    const placed = layoutLanes([
      { id: "a", start: 600, end: 660 },
      { id: "b", start: 630, end: 690 },
      { id: "c", start: 700, end: 760 },
    ]);
    const by = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect(by.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(by.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(by.c).toMatchObject({ lane: 0, lanes: 1 });
  });
});
