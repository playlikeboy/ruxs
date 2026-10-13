import { describe, it, expect } from "bun:test";
import { buildUpiUrl } from "./upi";

describe("upi payment link builder", () => {
  it("constructs upi:// URL with encoded parameters and 2-decimal rupees", () => {
    const url = buildUpiUrl({
      vpa: "annapurna@icici",
      payeeName: "Annapurna Tiffin",
      amountPaise: 9000, // ₹90
      billNumber: "RX-202610-001",
    });

    expect(url).toBe(
      "upi://pay?pa=annapurna%40icici&pn=Annapurna+Tiffin&am=90.00&cu=INR&tn=RX-202610-001"
    );
  });

  it("handles fractions of rupees properly", () => {
    const url = buildUpiUrl({
      vpa: "neer@okhdfcbank",
      payeeName: "Neer Water",
      amountPaise: 123450, // ₹1,234.50
      billNumber: "RX-202610-042",
    });

    expect(url).toBe(
      "upi://pay?pa=neer%40okhdfcbank&pn=Neer+Water&am=1234.50&cu=INR&tn=RX-202610-042"
    );
  });
});
