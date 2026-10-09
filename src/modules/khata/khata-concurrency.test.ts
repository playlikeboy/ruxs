import { describe, it, expect, beforeEach } from "bun:test";
import { KhataLedgerService } from "./khata-ledger";
import { Paise } from "../../shared/types/money";

describe("Digital Khata Concurrency & Idempotency", () => {
  beforeEach(() => {
    KhataLedgerService.clearStore();
  });

  it("prevents double-crediting when identical reference payment is processed twice", async () => {
    const tenantId = "ten_tiffin_safe";
    const customerId = "usr_aarav";

    const entry1 = await KhataLedgerService.recordEntry({
      tenantId,
      customerId,
      entryType: "PAYMENT_CREDIT",
      direction: "CREDIT",
      amountPaise: 50000, // ₹500
      referenceType: "PAYMENT",
      referenceId: "pay_order_unique_999",
      description: "UPI Payment Settled",
    });

    const entry2 = await KhataLedgerService.recordEntry({
      tenantId,
      customerId,
      entryType: "PAYMENT_CREDIT",
      direction: "CREDIT",
      amountPaise: 50000,
      referenceType: "PAYMENT",
      referenceId: "pay_order_unique_999",
      description: "UPI Payment Settled Duplicate",
    });

    // Both should return the same entry ID and balance should not be decremented twice
    expect(entry2.id).toBe(entry1.id);
    expect(entry2.runningBalancePaise).toBe(entry1.runningBalancePaise);

    const statement = await KhataLedgerService.getCustomerStatement(tenantId, customerId);
    expect(statement.entries.length).toBe(1);
  });

  it("guarantees tenant isolation: balances between two different vendors never cross-pollinate", async () => {
    const customerId = "usr_shared_customer";
    const tenantA = "ten_milk_dairy";
    const tenantB = "ten_lunch_tiffin";

    // Customer owes Vendor A ₹300
    await KhataLedgerService.recordEntry({
      tenantId: tenantA,
      customerId,
      entryType: "FULFILLMENT_DEBIT",
      direction: "DEBIT",
      amountPaise: 30000,
      description: "Cow Milk Daily",
    });

    // Customer owes Vendor B ₹700
    await KhataLedgerService.recordEntry({
      tenantId: tenantB,
      customerId,
      entryType: "FULFILLMENT_DEBIT",
      direction: "DEBIT",
      amountPaise: 70000,
      description: "Tiffin Thali Daily",
    });

    const balA = await KhataLedgerService.getBalance(tenantA, customerId);
    const balB = await KhataLedgerService.getBalance(tenantB, customerId);

    expect(balA).toBe(30000);
    expect(balB).toBe(70000);
  });
});
