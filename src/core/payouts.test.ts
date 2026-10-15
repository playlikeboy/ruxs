import { describe, it, expect } from "bun:test";
import { commissionPaise, paymentState, vendorBalance } from "./payouts";

describe("commission", () => {
  it("rounds the fee down in integer paise", () => {
    expect(commissionPaise(10000, 250)).toBe(250);
    expect(commissionPaise(999, 250)).toBe(24);
    expect(commissionPaise(10000, 0)).toBe(0);
  });

  it("rejects floats and out-of-range rates", () => {
    expect(() => commissionPaise(100.5, 100)).toThrow();
    expect(() => commissionPaise(100, 6000)).toThrow();
  });
});

describe("vendor balance", () => {
  it("counts only settled money as withdrawable, minus fee and payouts", () => {
    const b = vendorBalance(
      [
        { amountPaise: 30000, state: "settled" },
        { amountPaise: 20000, state: "settled" },
        { amountPaise: 9000, state: "pending" },
        { amountPaise: 5000, state: "excluded" },
      ],
      [
        { amountPaise: 10000, status: "paid" },
        { amountPaise: 5000, status: "requested" },
        { amountPaise: 99999, status: "rejected" },
      ],
      200
    );
    expect(b).toEqual({
      settledPaise: 50000,
      feePaise: 1000,
      pendingPaise: 9000,
      withdrawnPaise: 10000,
      requestedPaise: 5000,
      availablePaise: 34000,
    });
  });

  it("never goes below zero", () => {
    expect(vendorBalance([], [{ amountPaise: 100, status: "paid" }], 0).availablePaise).toBe(0);
  });
});

describe("payment state", () => {
  it("settles dues at once and orders on delivery", () => {
    expect(paymentState("dues", null)).toBe("settled");
    expect(paymentState("shop_order", "delivered")).toBe("settled");
    expect(paymentState("shop_order", "accepted")).toBe("pending");
    expect(paymentState("shop_order", "rejected")).toBe("excluded");
  });
});
