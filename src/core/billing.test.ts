import { describe, it, expect } from "bun:test";
import { computeInvoice, formatInvoiceNumber } from "./billing";

describe("billing rules", () => {
  it("computes monthly invoice opening, charges, payments, and closing balance", () => {
    // Period: October 2026
    const period = "2026-10";

    const entries = [
      // September entries (Opening balance)
      {
        type: "delivery",
        amountPaise: 9000,
        createdAt: new Date("2026-09-28T10:00:00Z"),
      },
      {
        type: "payment",
        amountPaise: -5000,
        createdAt: new Date("2026-09-30T10:00:00Z"),
      },
      // October entries (This month's charges and payments)
      {
        type: "delivery",
        amountPaise: 9000,
        createdAt: new Date("2026-10-05T10:00:00Z"),
      },
      {
        type: "delivery",
        amountPaise: 9000,
        createdAt: new Date("2026-10-06T10:00:00Z"),
      },
      {
        type: "late_fee",
        amountPaise: 4500,
        createdAt: new Date("2026-10-08T10:00:00Z"),
      },
      {
        type: "payment",
        amountPaise: -15000,
        createdAt: new Date("2026-10-15T10:00:00Z"),
      },
      // November entries (Future month - should not affect October invoice)
      {
        type: "delivery",
        amountPaise: 9000,
        createdAt: new Date("2026-11-01T10:00:00Z"),
      },
    ];

    const invoice = computeInvoice(entries, period);

    // Opening = 9000 - 5000 = 4000
    expect(invoice.openingPaise).toBe(4000);

    // Charges in Oct = 9000 + 9000 + 4500 = 22500
    expect(invoice.chargesPaise).toBe(22500);

    // Payments in Oct = 15000
    expect(invoice.paymentsPaise).toBe(15000);

    // Closing = 4000 + 22500 - 15000 = 11500
    expect(invoice.closingPaise).toBe(11500);
  });

  it("formats invoice numbers as RX-YYYYMM-seq", () => {
    expect(formatInvoiceNumber("2026-10", 1)).toBe("RX-202610-001");
    expect(formatInvoiceNumber("2026-10", 42)).toBe("RX-202610-042");
    expect(formatInvoiceNumber("2026-10", 1005)).toBe("RX-202610-1005");
  });
});
