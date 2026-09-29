import { PaymentRecord, CreatePaymentOrderSchema } from "./payment-schema";
import { KhataLedgerService } from "../khata/khata-ledger";
import { BillingEngine } from "../billing/billing-engine";
import { Paise } from "../../shared/types/money";
import { db, isTestEnv, payments as paymentsTable } from "../../shared/db";
import { eq, and } from "drizzle-orm";

const paymentsStore = new Map<string, PaymentRecord>();
const processedGatewayIds = new Set<string>();

function mapDbPayment(row: typeof paymentsTable.$inferSelect): PaymentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    customerId: row.customerId,
    invoiceId: row.invoiceId || undefined,
    amountPaise: row.amountPaise as Paise,
    method: row.method as PaymentRecord["method"],
    status: row.status as PaymentRecord["status"],
    gatewayOrderId: row.gatewayOrderId || "",
    gatewayPaymentId: row.gatewayPaymentId || undefined,
    bankUtr: row.bankUtr || undefined,
    khataEntryId: row.khataEntryId || undefined,
    settledAt: row.settledAt ? row.settledAt.toISOString() : undefined,
    upiDeepLink: undefined,
    qrPayload: undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.settledAt ? row.settledAt.toISOString() : row.createdAt.toISOString(),
  };
}

export class PaymentService {
  static generateUpiIntentUrl(params: {
    upiId: string;
    recipientName: string;
    amountRupees: number;
    transactionNote: string;
    orderId: string;
  }): string {
    const formattedAmount = params.amountRupees.toFixed(2);
    const query = new URLSearchParams({
      pa: params.upiId,
      pn: params.recipientName,
      am: formattedAmount,
      cu: "INR",
      tn: params.transactionNote,
      tr: params.orderId,
    });
    return `upi://pay?${query.toString()}`;
  }

  static async verifyHmacSha256(payload: string, signatureHex: string, secret: string): Promise<boolean> {
    try {
      if (!/^[0-9a-fA-F]{64}$/.test(signatureHex)) return false;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );
      const signatureBytes = new Uint8Array(signatureHex.match(/.{2}/g)!.map((hex) => parseInt(hex, 16)));
      return await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));
    } catch {
      return false;
    }
  }

  static async signPayload(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  static async createPaymentOrder(rawInput: unknown): Promise<PaymentRecord> {
    const validated = CreatePaymentOrderSchema.parse(rawInput);
    const paymentId = `pay_${crypto.randomUUID()}`;
    const gatewayOrderId = `order_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const upiDeepLink = this.generateUpiIntentUrl({
      upiId: validated.recipientUpiId,
      recipientName: validated.recipientName,
      amountRupees: validated.amountPaise / 100,
      transactionNote: `Payment for RUXS #${validated.invoiceId || paymentId}`,
      orderId: gatewayOrderId,
    });

    const payment: PaymentRecord = {
      id: paymentId,
      tenantId: validated.tenantId,
      customerId: validated.customerId,
      invoiceId: validated.invoiceId,
      amountPaise: validated.amountPaise as Paise,
      method: "UPI_INTENT",
      status: "INITIATED",
      gatewayOrderId,
      upiDeepLink,
      qrPayload: upiDeepLink,
      createdAt: now,
      updatedAt: now,
    };

    if (!isTestEnv) {
      await db.insert(paymentsTable).values({
        id: payment.id,
        tenantId: payment.tenantId,
        customerId: payment.customerId,
        invoiceId: payment.invoiceId || null,
        amountPaise: Number(payment.amountPaise),
        method: payment.method,
        status: payment.status,
        gatewayOrderId: payment.gatewayOrderId,
      });
    }

    paymentsStore.set(paymentId, payment);
    paymentsStore.set(gatewayOrderId, payment);
    return payment;
  }

  static async handleWebhookPaymentSuccess(params: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    bankUtr: string;
    rawPayload: string;
    signature: string;
    webhookSecret: string;
  }): Promise<{ payment: PaymentRecord; wasAlreadyProcessed: boolean }> {
    if (!await this.verifyHmacSha256(params.rawPayload, params.signature, params.webhookSecret)) {
      throw new Error("Invalid cryptographic webhook signature");
    }

    let payment = paymentsStore.get(params.gatewayOrderId);
    if (!payment && !isTestEnv) {
      const rows = await db.select().from(paymentsTable)
        .where(eq(paymentsTable.gatewayOrderId, params.gatewayOrderId))
        .limit(1);
      if (rows[0]) {
        payment = mapDbPayment(rows[0]);
        paymentsStore.set(payment.id, payment);
        paymentsStore.set(payment.gatewayOrderId, payment);
      }
    }

    if (!payment) throw new Error("Payment order not found");

    if (processedGatewayIds.has(params.gatewayPaymentId) || payment.status === "SUCCESS") {
      if (payment.gatewayPaymentId === params.gatewayPaymentId || payment.status === "SUCCESS") {
        processedGatewayIds.add(params.gatewayPaymentId);
        return { payment, wasAlreadyProcessed: true };
      }
    }

    const now = new Date().toISOString();
    const khataEntry = await KhataLedgerService.recordEntry({
      tenantId: payment.tenantId,
      customerId: payment.customerId,
      entryType: "PAYMENT_CREDIT",
      direction: "CREDIT",
      amountPaise: payment.amountPaise,
      referenceType: "PAYMENT",
      referenceId: payment.id,
      description: `UPI Payment Settled (UTR: ${params.bankUtr})`,
    });

    if (payment.invoiceId) {
      await BillingEngine.recordInvoicePayment(payment.invoiceId, payment.amountPaise);
    }

    payment.status = "SUCCESS";
    payment.gatewayPaymentId = params.gatewayPaymentId;
    payment.bankUtr = params.bankUtr;
    payment.settledAt = now;
    payment.khataEntryId = khataEntry.id;
    payment.updatedAt = now;

    if (!isTestEnv) {
      await db.update(paymentsTable)
        .set({
          status: "SUCCESS",
          gatewayPaymentId: params.gatewayPaymentId,
          bankUtr: params.bankUtr,
          khataEntryId: khataEntry.id,
          settledAt: new Date(now),
        })
        .where(and(
          eq(paymentsTable.id, payment.id),
          eq(paymentsTable.status, "INITIATED")
        ));
    }

    processedGatewayIds.add(params.gatewayPaymentId);
    paymentsStore.set(payment.id, payment);
    paymentsStore.set(payment.gatewayOrderId, payment);
    return { payment, wasAlreadyProcessed: false };
  }

  static getById(id: string): PaymentRecord | null {
    return paymentsStore.get(id) || null;
  }

  static clearStore(): void {
    paymentsStore.clear();
    processedGatewayIds.clear();
  }
}
