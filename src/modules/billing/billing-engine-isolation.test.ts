import { describe, it, expect, beforeEach } from "bun:test";
import { BillingEngine } from "./billing-engine";
import { KhataLedgerService } from "../khata/khata-ledger";
import { Paise } from "../../shared/types/money";

describe("Monthly Billing Engine Period Isolation & Idempotency", () => {
  beforeEach(() => {
    KhataLedgerService.clearStore();
    BillingEngine.clearStore();
  });

  it("strictly excludes historical ledger entries from invoice items and includes them in previous balance", async () => {
    const tenantId = "ten_sharma_tiffin";
    const customerId = "usr_kavita";

    // August entry (historical): ₹150
    await KhataLedgerService.recordEntry({
      tenantId,
      customerId,
      entryType: "FULFILLMENT_DEBIT",
      direction: "DEBIT",
      amountPaise: 15000,
      description: "August Tiffin Delivery (2026-08-25)",
    });

    // September entry: ₹120
    await KhataLedgerService.recordEntry({
      tenantId,
      customerId,
      entryType: "FULFILLMENT_DEBIT",
      direction: "DEBIT",
      amountPaise: 12000,
      description: "September Tiffin Delivery (2026-09-05)",
    });

    const invoice = await BillingEngine.generateInvoice({
      tenantId,
      customerId,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
    });

    // Only September entry should be an item
    expect(invoice.items.length).toBe(1);
    expect(invoice.items[0].description).toContain("2026-09-05");
    expect(invoice.subtotalPaise).toBe(12000 as Paise);

    // Prior balance from August should be ₹150 (15000 paise)
    expect(invoice.previousBalancePaise).toBe(15000 as Paise);

    // Total due: 15000 (prior) + 12000 (September) = 27000 paise
    expect(invoice.totalAmountDuePaise).toBe(27000 as Paise);
  });

  it("is idempotent: generating invoice twice returns the exact same invoice without duplicates", async () => {
    const tenantId = "ten_sharma_tiffin";
    const customerId = "usr_deepak";

    await KhataLedgerService.recordEntry({
      tenantId,
      customerId,
      entryType: "FULFILLMENT_DEBIT",
      direction: "DEBIT",
      amountPaise: 10000,
      description: "Tiffin Service (2026-09-10)",
    });

    const inv1 = await BillingEngine.generateInvoice({
      tenantId,
      customerId,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
    });

    const inv2 = await BillingEngine.generateInvoice({
      tenantId,
      customerId,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
    });

    expect(inv2.id).toBe(inv1.id);
    expect(inv2.invoiceNumber).toBe(inv1.invoiceNumber);
    expect(inv2.totalAmountDuePaise).toBe(inv1.totalAmountDuePaise);
  });
});
