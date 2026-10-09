import { describe, it, expect, beforeEach } from "bun:test";
import { PaymentService } from "./payment-service";
import { KhataLedgerService } from "../khata/khata-ledger";
import { BillingEngine } from "../billing/billing-engine";
import { Paise } from "../../shared/types/money";

describe("Payments Concurrency & Overpayment Prevention", () => {
  const webhookSecret = "test_webhook_secret_key_32_bytes_long";

  beforeEach(() => {
    KhataLedgerService.clearStore();
    BillingEngine.clearStore();
    PaymentService.clearStore();
  });

  it("safely handles concurrent duplicate webhook deliveries of the same payment", async () => {
    const tenantId = "ten_sharma_tiffin";
    const customerId = "usr_concurrent_user";

    const order = await PaymentService.createPaymentOrder({
      tenantId,
      customerId,
      amountPaise: 25000, // ₹250
      recipientUpiId: "sharma@upi",
      recipientName: "Sharma Tiffin",
    });

    const payload = JSON.stringify({
      orderId: order.gatewayOrderId,
      paymentId: "pay_rzp_concurrent_123",
      utr: "UTR_CONC_777888",
    });
    const signature = await PaymentService.signPayload(payload, webhookSecret);

    // Simulate 2 webhooks arriving at the exact same moment
    const [res1, res2] = await Promise.all([
      PaymentService.handleWebhookPaymentSuccess({
        gatewayOrderId: order.gatewayOrderId,
        gatewayPaymentId: "pay_rzp_concurrent_123",
        bankUtr: "UTR_CONC_777888",
        rawPayload: payload,
        signature,
        webhookSecret,
      }),
      PaymentService.handleWebhookPaymentSuccess({
        gatewayOrderId: order.gatewayOrderId,
        gatewayPaymentId: "pay_rzp_concurrent_123",
        bankUtr: "UTR_CONC_777888",
        rawPayload: payload,
        signature,
        webhookSecret,
      }),
    ]);

    // Exactly one should be processed=false, and one wasAlreadyProcessed=true
    const processedCount = [res1.wasAlreadyProcessed, res2.wasAlreadyProcessed].filter((x) => !x).length;
    expect(processedCount).toBe(1);

    // Exactly 1 Khata credit should be registered
    const statement = await KhataLedgerService.getCustomerStatement(tenantId, customerId);
    expect(statement.entries.length).toBe(1);
    expect(statement.totalCreditsPaise).toBe(25000 as Paise);
  });

  it("prevents creating a payment order that exceeds the remaining unpaid amount on an invoice", async () => {
    const tenantId = "ten_sharma_tiffin";
    const customerId = "usr_overpay_user";

    // Customer has ₹100 charge
    await KhataLedgerService.recordEntry({
      tenantId,
      customerId,
      entryType: "FULFILLMENT_DEBIT",
      direction: "DEBIT",
      amountPaise: 10000, // ₹100
      description: "Thali",
    });

    const invoice = await BillingEngine.generateInvoice({
      tenantId,
      customerId,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
    });

    // Try paying ₹200 on a ₹100 invoice
    expect(
      PaymentService.createPaymentOrder({
        tenantId,
        customerId,
        invoiceId: invoice.id,
        amountPaise: 20000, // ₹200
        recipientUpiId: "sharma@upi",
        recipientName: "Sharma Tiffin",
      })
    ).rejects.toThrow("exceeds invoice remaining balance");
  });
});
