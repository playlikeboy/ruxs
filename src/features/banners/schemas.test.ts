import { describe, expect, it } from "bun:test";
import { bannerSchema } from "./schemas";

const base = { title: "Diwali offer", href: "/app/category/gifts", tone: "peach" as const, sort: 0, isActive: true };

describe("bannerSchema", () => {
  it("accepts in-app paths and https links", () => {
    expect(bannerSchema.safeParse(base).success).toBe(true);
    expect(bannerSchema.safeParse({ ...base, href: "https://ruxs.in/for/tiffin-services" }).success).toBe(true);
  });

  it("rejects links that could leave the site unsafely", () => {
    for (const href of ["javascript:alert(1)", "//evil.com", "http://plain.com", "evil.com"]) {
      expect(bannerSchema.safeParse({ ...base, href }).success, href).toBe(false);
    }
    expect(bannerSchema.safeParse({ ...base, imageUrl: "javascript:x" }).success).toBe(false);
  });

  it("needs the end after the start", () => {
    expect(bannerSchema.safeParse({ ...base, startsAt: "2026-11-02T00:00", endsAt: "2026-11-01T00:00" }).success).toBe(false);
  });
});
