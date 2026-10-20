import { describe, it, expect } from "bun:test";
import { computeInvoice, formatInvoiceNumber } from "./billing";

describe("invoices & billing core rules", () => {
  it("formats standard invoice numbers correctly", () => {
    expect(formatInvoiceNumber("2026-10", 1)).toBe("RX-202610-001");
    expect(formatInvoiceNumber("2026-11", 42)).toBe("RX-202611-042");
    expect(formatInvoiceNumber("2027-01", 1234)).toBe("RX-202701-1234");
  });

  it("calculates zero closing balance when fully paid", () => {
    const entries = [
      {
        type: "delivery",
        amountPaise: 300000, // ₹3000
        createdAt: new Date("2026-10-05T08:00:00Z"),
      },
      {
        type: "payment",
        amountPaise: -300000, // -₹3000
        createdAt: new Date("2026-10-25T12:00:00Z"),
      },
    ];

    const inv = computeInvoice(entries, "2026-10");
    expect(inv.chargesPaise).toBe(300000);
    expect(inv.paymentsPaise).toBe(300000);
    expect(inv.closingPaise).toBe(0);
  });

  it("calculates positive closing balance when balance is overdue", () => {
    const entries = [
      {
        type: "delivery",
        amountPaise: 450000, // ₹4500
        createdAt: new Date("2026-10-10T08:00:00Z"),
      },
      {
        type: "payment",
        amountPaise: -200000, // -₹2000
        createdAt: new Date("2026-10-20T12:00:00Z"),
      },
    ];

    const inv = computeInvoice(entries, "2026-10");
    expect(inv.chargesPaise).toBe(450000);
    expect(inv.paymentsPaise).toBe(200000);
    expect(inv.closingPaise).toBe(250000); // ₹2500 outstanding
  });
});
