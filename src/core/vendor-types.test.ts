import { describe, expect, it } from "bun:test";
import { VENDOR_TYPES, VENDOR_TYPE_INFO, allowedCategoryIds, canUseModule, homeModule, toVendorType, vendorTypeForCategory } from "./vendor-types";
import { ITEM_FIELDS, PROFILE_FIELDS, chipsFor } from "@/features/vendor-types/fields";
import { valuesSchema } from "@/features/vendor-types/schemas";

describe("vendor types", () => {
  it("keeps a physiotherapist out of kids, menu and delivery tools", () => {
    for (const m of ["kids", "products", "orders", "run", "subscriptions", "inventory", "bills"] as const) {
      expect(canUseModule("physio", m)).toBe(false);
    }
    expect(canUseModule("physio", "bookings")).toBe(true);
    expect(canUseModule("physio", "services")).toBe(true);
  });

  it("gives tiffin, water and milk the daily delivery tools only", () => {
    for (const t of ["tiffin", "water", "milk"] as const) {
      expect(canUseModule(t, "run")).toBe(true);
      expect(canUseModule(t, "subscriptions")).toBe(true);
      expect(canUseModule(t, "bookings")).toBe(false);
      expect(canUseModule(t, "kids")).toBe(false);
      expect(canUseModule(t, "services")).toBe(false);
    }
  });

  it("only kids academies see the kids workspace", () => {
    for (const t of VENDOR_TYPES) expect(canUseModule(t, "kids")).toBe(t === "kids");
  });

  it("maps categories to types", () => {
    expect(vendorTypeForCategory("tiffin")).toBe("tiffin");
    expect(vendorTypeForCategory("milk")).toBe("milk");
    expect(vendorTypeForCategory("kids-kits")).toBe("store");
    expect(vendorTypeForCategory("other")).toBe("store");
    expect(vendorTypeForCategory("yoga", "booking")).toBe("fitness");
    expect(toVendorType("nonsense", "delivery")).toBe("store");
    expect(toVendorType("physio")).toBe("physio");
  });

  it("lets a vendor list items only in its own category", () => {
    expect(allowedCategoryIds("tiffin", "tiffin")).toEqual(["tiffin"]);
    expect(allowedCategoryIds("store", null)).toEqual(["other"]);
    expect(allowedCategoryIds("store", "kids-kits")).toEqual(["kids-kits"]);
  });

  it("sends a blocked tool to the type's home", () => {
    expect(homeModule("physio")).toBe("bookings");
    expect(homeModule("tiffin")).toBe("orders");
  });

  it("has a profile form and fulfilment for every type", () => {
    for (const t of VENDOR_TYPES) {
      expect(PROFILE_FIELDS[t].length).toBeGreaterThan(2);
      expect(["delivery", "booking"]).toContain(VENDOR_TYPE_INFO[t].fulfilment);
      expect(VENDOR_TYPE_INFO[t].modules).toContain("today");
      expect(VENDOR_TYPE_INFO[t].modules).toContain("settings");
    }
  });
});

describe("type field validation", () => {
  it("converts rupees to paise and blanks to null", () => {
    const parsed = valuesSchema(PROFILE_FIELDS.physio).parse({
      headline: "  ",
      qualifications: "BPT",
      registrationNumber: "",
      experienceYears: 6,
      specialities: ["Ortho"],
      conditionsTreated: [],
      languages: ["Hindi"],
      gender: "female",
      clinicName: "",
      clinicAddress: "",
      homeVisits: true,
      homeVisitFeePaise: 150.5,
    });
    expect(parsed.headline).toBeNull();
    expect(parsed.homeVisitFeePaise).toBe(15050);
    expect(parsed.experienceYears).toBe(6);
  });

  it("rejects an option that isn't on the list", () => {
    const r = valuesSchema(ITEM_FIELDS.tiffin!).safeParse({ mealType: "brunch", diet: "veg", spiceLevel: "mild", itemsIncluded: "", cuisine: "", calories: null });
    expect(r.success).toBe(false);
  });

  it("builds readable chips", () => {
    expect(chipsFor(ITEM_FIELDS.water!, { volumeMl: 20000, packSize: 1, container: "can", returnable: true, chilled: false })).toEqual(["20 L", "1 per pack", "Can", "Returnable (collect empties)"]);
  });
});
