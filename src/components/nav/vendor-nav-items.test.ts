import { describe, expect, it } from "bun:test";
import { VENDOR_TYPES, canUseModule } from "@/core/vendor-types";
import { vendorTabs } from "./vendor-nav-items";

describe("vendorTabs", () => {
  it("only links to tools the vendor type has, so no tab bounces to Calendar", () => {
    for (const type of VENDOR_TYPES) {
      const dead = vendorTabs(type).filter((t) => !canUseModule(type, t.module));
      expect({ type, dead }).toEqual({ type, dead: [] });
    }
  });
});
