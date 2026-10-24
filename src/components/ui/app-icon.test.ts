import { describe, expect, it } from "bun:test";
import { CookingPot, Droplets, GraduationCap, Package, Store } from "lucide-react";
import { iconFor } from "./app-icon";
import { VENDOR_TYPES } from "@/core/vendor-types";

describe("iconFor", () => {
  it("maps known ids and falls back by keyword, then to a store", () => {
    expect(iconFor("tiffin")).toBe(CookingPot);
    expect(iconFor("water")).toBe(Droplets);
    expect(iconFor("kids-kits")).toBe(Package);
    expect(iconFor("home-tiffin-thali")).toBe(CookingPot);
    expect(iconFor("kids_tutor_new")).toBe(GraduationCap);
    expect(iconFor("totally-unknown")).toBe(Store);
    expect(iconFor(null)).toBe(Store);
  });
  it("has a specific icon for every vendor type", () => {
    for (const t of VENDOR_TYPES) expect(iconFor(t)).toBeDefined();
  });
});
