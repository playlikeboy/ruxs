import { describe, it, expect } from "bun:test";
import { sortRunSheet } from "./run-sheet";

describe("run-sheet sorting rules", () => {
  it("sorts by society ASC, tower ASC, floor DESC, and flat natural ASC", () => {
    const stops = [
      { id: "1", society: "Palm Springs", tower: "Tower 1", floor: "3", flat: "301" },
      { id: "2", society: "Green Glen", tower: "Tower A", floor: "2", flat: "A-10" },
      { id: "3", society: "Green Glen", tower: "Tower A", floor: "10", flat: "1004" },
      { id: "4", society: "Green Glen", tower: "Tower A", floor: "2", flat: "A-2" },
      { id: "5", society: "Green Glen", tower: "Tower B", floor: "4", flat: "401" },
      { id: "6", society: "Green Glen", tower: "Tower A", floor: "5", flat: "502" },
    ];

    const sorted = sortRunSheet(stops);

    // Green Glen should come before Palm Springs
    expect(sorted[0]?.society).toBe("Green Glen");

    // In Green Glen Tower A: Floor 10 (top) first, then Floor 5, then Floor 2
    expect(sorted[0]?.floor).toBe("10");
    expect(sorted[1]?.floor).toBe("5");

    // On Floor 2: natural sort A-2 before A-10
    expect(sorted[2]?.flat).toBe("A-2");
    expect(sorted[3]?.flat).toBe("A-10");

    // Tower B follows Tower A
    expect(sorted[4]?.tower).toBe("Tower B");

    // Palm Springs last
    expect(sorted[5]?.society).toBe("Palm Springs");
  });
});
