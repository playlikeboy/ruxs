import { describe, it, expect } from "bun:test";
import { canBalance } from "./assets";

describe("merchant differentiated tools rules", () => {
  it("computes net water bottle balance held by households", () => {
    const movements = [
      { delta: 2 }, // delivered 2 cans
      { delta: -1 }, // customer returned 1 can
      { delta: 1 }, // customer requested 1 extra can
    ];
    expect(canBalance(movements)).toBe(2);
  });

  it("handles negative adjustments when extra returns are logged", () => {
    const movements = [
      { delta: 1 },
      { delta: -2 }, // customer returned 2 cans (e.g. from previous vendor)
    ];
    expect(canBalance(movements)).toBe(-1);
  });
});
