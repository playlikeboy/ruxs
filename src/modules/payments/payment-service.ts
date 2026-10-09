import { PaymentRecord, CreatePaymentOrderSchema } from "./payment-schema";
import { KhataLedgerService } from "../khata/khata-ledger";
import { BillingEngine } from "../billing/billing-engine";
import { Paise } from "../../shared/types/money";
import { db, isTestEnv, payments as paymentsTable, webhookEvents } from "../../shared/db";
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

  /**
   * Creates a payment order, validating against invoice overpayment
   */
  static async createPaymentOrder(rawInput: unknown): Promise<PaymentRecord> {
    const validated = CreatePaymentOrderSchema.parse(rawInput);

    // Guard against invoice overpayment
    if (validated.invoiceId) {
      const invoice = await BillingEngine.getById(validated.invoiceId);
      if (invoice) {
        const remainingPaise = Math.max(0, invoice.totalAmountDuePaise - invoice.amountPaidPaise);
        if (remainingPaise <= 0) {
          throw new Error("Invoice is already fully paid");
        }
        if (validated.amountPaise > remainingPaise) {
          throw new Error(`Payment amount (₹${validated.amountPaise / 100}) exceeds invoice remaining balance (₹${remainingPaise / 100})`);
        }
      }
    }

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

  /**
   * Atomically settles a webhook payment success event.
   * Enforces signature verification, durable event deduplication, and atomic settlement.
   */
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

    // 1. Authoritative lookup of payment order from PostgreSQL
    let payment: PaymentRecord | null = null;
    if (!isTestEnv) {
      const rows = await db.select().from(paymentsTable)
        .where(eq(paymentsTable.gatewayOrderId, params.gatewayOrderId))
        .limit(1);
      if (rows[0]) {
        payment = mapDbPayment(rows[0]);
        paymentsStore.set(payment.id, payment);
        paymentsStore.set(payment.gatewayOrderId, payment);
      }
    }

    if (!payment) {
      payment = paymentsStore.get(params.gatewayOrderId) || null;
    }

    if (!payment) throw new Error("Payment order not found");

    // 2. Durable Idempotency Check via webhook_events / processedGatewayIds
    if (!isTestEnv) {
      const existingEvents = await db.select().from(webhookEvents)
        .where(and(
          eq(webhookEvents.provider, "PAYMENT"),
          eq(webhookEvents.eventId, params.gatewayPaymentId)
        ))
        .limit(1);

      if (existingEvents.length > 0 || payment.status === "SUCCESS") {
        return { payment, wasAlreadyProcessed: true };
      }
    } else {
      if (processedGatewayIds.has(params.gatewayPaymentId) || payment.status === "SUCCESS") {
        processedGatewayIds.add(params.gatewayPaymentId);
        return { payment, wasAlreadyProcessed: true };
      }
    }

    // 3. Atomically claim payment processing in PostgreSQL
    if (!isTestEnv) {
      const claim = await db.update(paymentsTable)
        .set({
          status: "PENDING",
          gatewayPaymentId: params.gatewayPaymentId,
          bankUtr: params.bankUtr,
        })
        .where(and(
          eq(paymentsTable.id, payment.id),
          eq(paymentsTable.status, "INITIATED"),
        ))
        .returning({ id: paymentsTable.id });

      if (claim.length === 0) {
        const currentRows = await db.select().from(paymentsTable)
          .where(eq(paymentsTable.id, payment.id))
          .limit(1);
        const current = currentRows[0];
        if (current?.status === "SUCCESS" || current?.status === "PENDING") {
          return { payment: current ? mapDbPayment(current) : payment, wasAlreadyProcessed: true };
        }
        throw new Error("Payment order is not available for processing");
      }
    }

    const now = new Date().toISOString();

    try {
      // 4. Record Digital Khata credit (with its own internal idempotency check)
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

      // 5. Apply payment to invoice if linked
      if (payment.invoiceId) {
        await BillingEngine.recordInvoicePayment(payment.invoiceId, payment.amountPaise);
      }

      // 6. Finalize payment status as SUCCESS
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
            eq(paymentsTable.status, "PENDING"),
            eq(paymentsTable.gatewayPaymentId, params.gatewayPaymentId),
          ));

        // Record in durable webhook_events table
        await db.insert(webhookEvents).values({
          id: `ev_${crypto.randomUUID()}`,
          provider: "PAYMENT",
          eventId: params.gatewayPaymentId,
          eventType: "PAYMENT_SUCCESS",
          payload: params.rawPayload,
          status: "PROCESSED",
        }).onConflictDoNothing();
      }

      if (isTestEnv) processedGatewayIds.add(params.gatewayPaymentId);
      paymentsStore.set(payment.id, payment);
      paymentsStore.set(payment.gatewayOrderId, payment);
      return { payment, wasAlreadyProcessed: false };
    } catch (error) {
      if (!isTestEnv) {
        await db.update(paymentsTable)
          .set({
            status: "INITIATED",
            gatewayPaymentId: null,
            bankUtr: null,
          })
          .where(and(
            eq(paymentsTable.id, payment.id),
            eq(paymentsTable.status, "PENDING"),
            eq(paymentsTable.gatewayPaymentId, params.gatewayPaymentId),
          ));
      }
      throw error;
    }
  }

  static getById(id: string): PaymentRecord | null {
    return paymentsStore.get(id) || null;
  }

  static async getByIdAsync(id: string): Promise<PaymentRecord | null> {
    if (!isTestEnv) {
      try {
        const rows = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);
        if (rows[0]) return mapDbPayment(rows[0]);
      } catch (err) {
        console.error("Failed to query payment by id from DB:", err);
      }
    }
    return paymentsStore.get(id) || null;
  }

  static clearStore(): void {
    paymentsStore.clear();
    processedGatewayIds.clear();
  }
}
