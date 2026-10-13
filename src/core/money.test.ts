import { describe, it, expect } from "bun:test";
import { formatINR, rupeesToPaise, paiseToRupees } from "./money";

describe("money rules", () => {
  it("formats integer paise to INR currency strings", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(9000)).toBe("₹90");
    expect(formatINR(9050)).toBe("₹90.50");
    expect(formatINR(12345000)).toBe("₹1,23,450");
    expect(formatINR(12345075)).toBe("₹1,23,450.75");
    expect(formatINR(-50000)).toBe("-₹500");
  });

  it("converts rupees to integer paise without floating point error", () => {
    expect(rupeesToPaise(0)).toBe(0);
    expect(rupeesToPaise(90)).toBe(9000);
    expect(rupeesToPaise(90.5)).toBe(9050);
    expect(rupeesToPaise("90.50")).toBe(9050);
    expect(rupeesToPaise("1234.56")).toBe(123456);
  });

  it("converts paise to rupees", () => {
    expect(paiseToRupees(9000)).toBe(90);
    expect(paiseToRupees(9050)).toBe(90.5);
    expect(paiseToRupees(0)).toBe(0);
  });
});
