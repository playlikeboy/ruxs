import { describe, it, expect } from "bun:test";
import { canBalance, defaultStepper } from "./assets";

describe("asset tracking rules", () => {
  it("calculates customer can holding balance from movements", () => {
    const movements = [
      { delta: 2 }, // delivered 2 cans
      { delta: -1 }, // returned 1 can
      { delta: 1 }, // delivered 1 can
      { delta: -2 }, // returned 2 cans
    ];

    expect(canBalance(movements)).toBe(0);

    const holdingTwo = [{ delta: 2 }, { delta: 1 }, { delta: -1 }];
    expect(canBalance(holdingTwo)).toBe(2);
  });

  it("provides default 1-out 1-in stepper state for delivery runs", () => {
    expect(defaultStepper()).toEqual({ out: 1, in: 1 });
  });
});
