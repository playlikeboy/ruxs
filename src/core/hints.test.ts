import { describe, expect, it } from "bun:test";
import { merchantHint } from "./hints";
import { VENDOR_TYPES } from "./vendor-types";

describe("merchantHint", () => {
  it("speaks to each kind of business", () => {
    expect(merchantHint("kids_performing_arts")).toContain("booking requests");
    expect(merchantHint("physio")).toContain("Calendar");
    expect(merchantHint("tiffin")).toContain("Orders");
    for (const t of VENDOR_TYPES) expect(merchantHint(t).length).toBeGreaterThan(20);
  });
});
