import { describe, expect, it } from "bun:test";
import { starterCatalog } from "./starter-catalog";
import { VENDOR_TYPES, VENDOR_TYPE_INFO, canUseModule } from "./vendor-types";

describe("starterCatalog", () => {
  it("gives every vendor type a first menu that fits its tools", () => {
    for (const type of VENDOR_TYPES) {
      const c = starterCatalog(type);
      expect(c, type).not.toBeNull();
      expect(c!.items.length, type).toBeGreaterThan(0);
      if (c!.kind === "products") expect(canUseModule(type, "products"), type).toBe(true);
      if (c!.kind === "services") expect(VENDOR_TYPE_INFO[type].fulfilment, type).toBe("booking");
      if (c!.kind === "kids") expect(canUseModule(type, "kids"), type).toBe(true);
    }
  });

  it("uses integer paise and valid shapes", () => {
    for (const type of VENDOR_TYPES) {
      for (const item of starterCatalog(type)!.items) {
        expect(Number.isInteger(item.pricePaise)).toBe(true);
        expect(item.pricePaise).toBeGreaterThanOrEqual(0);
        if ("durationMinutes" in item) expect(item.durationMinutes).toBeGreaterThanOrEqual(15);
        if ("minAge" in item) expect(item.minAge).toBeLessThanOrEqual(item.maxAge);
        if ("cutoffAt" in item) expect(item.cutoffAt).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });
});
