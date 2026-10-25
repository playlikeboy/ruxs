import { describe, expect, it } from "bun:test";
import { defaultKidsCategory } from "./category-for-type";

const cats = [{ id: "academics" }, { id: "performing-arts" }, { id: "stem" }];

describe("defaultKidsCategory", () => {
  it("starts a dance studio's class in performing arts, not the first category", () => {
    expect(defaultKidsCategory("kids_performing_arts", cats)).toBe("performing-arts");
  });
  it("falls back to the first category when the mapped one is missing", () => {
    expect(defaultKidsCategory("kids_camps", cats)).toBe("academics");
    expect(defaultKidsCategory("kids", [])).toBe("");
  });
});
