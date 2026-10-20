import { describe, expect, it } from "bun:test";
import {
  calculateKidsTrialPrice,
  filterKidsActivities,
  formatAgeBadge,
  formatBatchUrgency,
  matchesAgeBracket,
  type ActivityFilterable,
} from "./kids";

describe("kids core business rules", () => {
  it("determines age bracket matches accurately", () => {
    // 6-8 bracket (Ages 6-8)
    expect(matchesAgeBracket(6, 10, "6-8")).toBe(true);
    expect(matchesAgeBracket(4, 7, "6-8")).toBe(true);
    expect(matchesAgeBracket(3, 5, "6-8")).toBe(false);
    expect(matchesAgeBracket(9, 14, "6-8")).toBe(false);

    // 3-5 bracket
    expect(matchesAgeBracket(3, 5, "3-5")).toBe(true);
    expect(matchesAgeBracket(4, 6, "3-5")).toBe(true);
    expect(matchesAgeBracket(7, 10, "3-5")).toBe(false);

    // All bracket always true
    expect(matchesAgeBracket(4, 12, "all")).toBe(true);
  });

  it("formats age badge text correctly", () => {
    expect(formatAgeBadge(6, 12)).toBe("Ages 6–12");
    expect(formatAgeBadge(5, 5)).toBe("Age 5");
    expect(formatAgeBadge(13, 18)).toBe("Ages 13+");
  });

  it("calculates trial prices in integer paise without floats", () => {
    // 50% off ₹500 (50000 paise) = 25000 paise
    expect(calculateKidsTrialPrice(50000, 50)).toBe(25000);
    // 33% off ₹999 (99900 paise)
    const discounted = calculateKidsTrialPrice(99900, 33);
    expect(Number.isInteger(discounted)).toBe(true);
    expect(discounted).toBe(66933);

    // Free trial (100% off)
    expect(calculateKidsTrialPrice(40000, 100)).toBe(0);

    // Invalid percentages
    expect(calculateKidsTrialPrice(30000, 0)).toBe(30000);
    expect(calculateKidsTrialPrice(30000, -10)).toBe(30000);
  });

  it("computes batch urgency and spots left accurately", () => {
    const full = formatBatchUrgency(8, 8);
    expect(full.isFull).toBe(true);
    expect(full.spotsLeft).toBe(0);
    expect(full.label).toBe("Batch Full");

    const urgent = formatBatchUrgency(6, 5);
    expect(urgent.isAlmostFull).toBe(true);
    expect(urgent.spotsLeft).toBe(1);
    expect(urgent.label).toBe("Only 1 spot left!");

    const normal = formatBatchUrgency(10, 4);
    expect(normal.isAlmostFull).toBe(false);
    expect(normal.spotsLeft).toBe(6);
    expect(normal.label).toBe("6 spots left");
  });

  it("filters activities by age bracket, category, format and query", () => {
    const mockActivities: ActivityFilterable[] = [
      {
        name: "Lego Robotics Junior",
        description: "Build motors and gears with scratch",
        minAge: 6,
        maxAge: 9,
        category: "stem",
        format: "studio",
      },
      {
        name: "Baby Picasso Finger Painting",
        description: "Mess free sensory art for toddlers",
        minAge: 3,
        maxAge: 5,
        category: "arts",
        format: "home_visit",
      },
      {
        name: "Grandmaster Chess Strategy",
        description: "Tactics and openings for serious kids",
        minAge: 8,
        maxAge: 15,
        category: "logic",
        format: "online_live",
      },
    ];

    // Filter by STEM category
    const stemOnly = filterKidsActivities(mockActivities, { category: "stem" });
    expect(stemOnly.length).toBe(1);
    expect(stemOnly[0]!.name).toBe("Lego Robotics Junior");

    // Filter by 3-5 age group
    const toddlerOnly = filterKidsActivities(mockActivities, { ageBracket: "3-5" });
    expect(toddlerOnly.length).toBe(1);
    expect(toddlerOnly[0]!.name).toBe("Baby Picasso Finger Painting");

    // Search query
    const searchMatch = filterKidsActivities(mockActivities, { searchQuery: "chess" });
    expect(searchMatch.length).toBe(1);
    expect(searchMatch[0]!.name).toBe("Grandmaster Chess Strategy");
  });
});
