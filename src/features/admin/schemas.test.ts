import { describe, expect, it } from "bun:test";
import { KIDS_VENDOR_TYPES } from "@/core/vendor-types";
import { applicationSchema } from "@/features/applications/schemas";
import { createVendorSchema } from "./schemas";

const vendor = {
  name: "Little Coders",
  phone: "+919876543210",
  upiVpa: "coders@upi",
  city: "Ranchi",
  area: "Lalpur",
  latitude: null,
  longitude: null,
  serviceRadiusKm: 8,
  deliveryFeeRupees: 0,
  minOrderRupees: 0,
  commissionPercent: 0,
  slug: "little-coders",
};

describe("onboarding category ids", () => {
  it("accepts every kids vendor type, whose ids use underscores", () => {
    for (const categoryId of KIDS_VENDOR_TYPES) {
      expect(createVendorSchema.safeParse({ ...vendor, categoryId }).success).toBe(true);
    }
  });

  it("accepts hyphenated daily categories and rejects junk", () => {
    expect(createVendorSchema.safeParse({ ...vendor, categoryId: "kids-kits" }).success).toBe(true);
    expect(createVendorSchema.safeParse({ ...vendor, categoryId: "" }).success).toBe(false);
    expect(createVendorSchema.safeParse({ ...vendor, categoryId: "Kids Stem" }).success).toBe(false);
  });

  it("lets the public application form pick a kids category", () => {
    const res = applicationSchema.safeParse({ businessName: "Little Coders", ownerName: "Asha", phone: "9876543210", categoryId: "kids_stem", area: "Lalpur", city: "Ranchi" });
    expect(res.success).toBe(true);
  });
});
