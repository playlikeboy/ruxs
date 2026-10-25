import { describe, it, expect } from "bun:test";
import { exactEmailMatch, merchantLoginEmail } from "./merchant-login";

describe("merchant login ids", () => {
  it("maps a plain id to its private login email", () => {
    expect(merchantLoginEmail(" Annapurna-Tiffin ")).toBe("annapurna-tiffin@merchant.ruxs.in");
  });

  it("leaves real emails alone", () => {
    expect(merchantLoginEmail("Owner@Example.com")).toBe("owner@example.com");
  });
});

describe("exactEmailMatch", () => {
  const users = [{ id: "a", primaryEmail: "debo-2@merchant.ruxs.in" }, { id: "b", primaryEmail: "Debo@merchant.ruxs.in" }, { id: "c", primaryEmail: null }];
  it("ignores fuzzy search neighbours and matches case-insensitively", () => {
    expect(exactEmailMatch(users, "debo@merchant.ruxs.in")?.id).toBe("b");
  });
  it("returns undefined when nobody owns the email", () => {
    expect(exactEmailMatch(users, "ghost@merchant.ruxs.in")).toBeUndefined();
  });
});
