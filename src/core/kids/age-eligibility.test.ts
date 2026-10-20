import { describe, expect, it } from "bun:test";
import {
  calculateAge,
  formatAgeRange,
  formatClassesList,
  isAgeEligible,
  isClassEligible,
} from "./age-eligibility";

describe("age-eligibility rules", () => {
  it("verifies age eligibility correctly", () => {
    expect(isAgeEligible(5, 3, 7)).toBe(true);
    expect(isAgeEligible(3, 3, 5)).toBe(true);
    expect(isAgeEligible(11, 5, 11)).toBe(true);
    expect(isAgeEligible(2, 3, 6)).toBe(false);
    expect(isAgeEligible(12, 4, 10)).toBe(false);
    expect(isAgeEligible(0, 3, 6)).toBe(false);
    expect(isAgeEligible(-1, 3, 6)).toBe(false);
  });

  it("verifies class eligibility correctly", () => {
    const classes = ["Class 1", "Class 2", "Class 3"];
    expect(isClassEligible("Class 2", classes)).toBe(true);
    expect(isClassEligible("class 1", classes)).toBe(true);
    expect(isClassEligible("Class 5", classes)).toBe(false);
    expect(isClassEligible(null, classes)).toBe(false);
    // Empty class list means open to all
    expect(isClassEligible("Class 5", [])).toBe(true);
  });

  it("calculates age from birth date or year accurately", () => {
    const fixedNow = new Date("2026-10-20T12:00:00Z");
    expect(calculateAge(2019, fixedNow)).toBe(7);
    expect(calculateAge("2020-05-15", fixedNow)).toBe(6);
    expect(calculateAge("2020-11-20", fixedNow)).toBe(5); // birthday not yet reached in 2026
    expect(calculateAge(null, fixedNow)).toBe(0);
    expect(calculateAge("invalid-date", fixedNow)).toBe(0);
  });

  it("formats age ranges and class labels cleanly", () => {
    expect(formatAgeRange(4, 8)).toBe("Ages 4–8");
    expect(formatAgeRange(5, 5)).toBe("Age 5");
    expect(formatClassesList(["Nursery", "LKG", "UKG"])).toBe("Nursery, LKG, UKG");
    expect(formatClassesList(["Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"])).toBe("Nursery to Class 5");
  });
});
