import { describe, it, expect } from "bun:test";
import { merchantLoginEmail } from "./merchant-login";

describe("merchant login ids", () => {
  it("maps a plain id to its private login email", () => {
    expect(merchantLoginEmail(" Annapurna-Tiffin ")).toBe("annapurna-tiffin@merchant.ruxs.in");
  });

  it("leaves real emails alone", () => {
    expect(merchantLoginEmail("Owner@Example.com")).toBe("owner@example.com");
  });
});
