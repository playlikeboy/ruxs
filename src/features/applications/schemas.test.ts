import { describe, expect, it } from "bun:test";
import { applicationSchema } from "./schemas";

const base = { businessName: "Rahul Dance Academy", ownerName: "Rahul", phone: "98765 43210", categoryId: "kids", area: "Morabadi", city: "Ranchi" };

describe("applicationSchema", () => {
  it("normalises Indian mobile formats", () => {
    for (const phone of ["9876543210", "09876543210", "+91 98765 43210", "98765-43210"]) {
      expect(applicationSchema.parse({ ...base, phone }).phone).toBe("+919876543210");
    }
  });
  it("rejects bad numbers, filled honeypots and bad emails", () => {
    expect(applicationSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, email: "" }).success).toBe(true);
  });
});
