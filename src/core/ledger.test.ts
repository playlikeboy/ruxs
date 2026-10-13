import { describe, it, expect } from "bun:test";
import {
  deliveryKey,
  lateFeeKey,
  depositKey,
  paymentKey,
  adjustmentKey,
  balance,
} from "./ledger";

describe("ledger rules", () => {
  it("builds deterministic idempotency keys per PRD §10 Rule 5", () => {
    expect(deliveryKey("ord_123")).toBe("order:ord_123:delivery");
    expect(lateFeeKey("ord_123")).toBe("order:ord_123:late");
    expect(depositKey("cust_456", "can")).toBe("cust:cust_456:deposit:can");
    expect(paymentKey("inv_789", 1)).toBe("invoice:inv_789:pay:1");
    expect(adjustmentKey("uuid_abc")).toBe("adj:uuid_abc");
  });

  it("calculates customer khata balance by summing signed integer paise", () => {
    const entries = [
      { amountPaise: 9000 }, // +₹90 delivery
      { amountPaise: 9000 }, // +₹90 delivery
      { amountPaise: 15000 }, // +₹150 can deposit
      { amountPaise: -30000 }, // -₹300 payment
      { amountPaise: -1000 }, // -₹10 credit adjustment
    ];

    expect(balance(entries)).toBe(2000); // ₹20 outstanding
  });

  it("returns zero balance for empty ledger", () => {
    expect(balance([])).toBe(0);
  });
});
