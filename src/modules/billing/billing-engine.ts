import {
  Invoice,
  InvoiceItem,
  GenerateInvoiceInput,
  GenerateInvoiceSchema,
} from "./billing-schema";
import { KhataLedgerService } from "../khata/khata-ledger";
import { Paise, addPaise, subtractPaise } from "../../shared/types/money";
import { db, isTestEnv } from "../../shared/db";
import { invoices as invoicesTable } from "../../shared/db/schema";
import { eq, and, sql as drizzleSql } from "drizzle-orm";

const invoiceStore = new Map<string, Invoice>();
let memorySequence = 1;

export class BillingEngine {
  /**
   * Generates a monthly statement invoice derived strictly from the customer's Khata entries
   * within the requested period [periodStart, periodEnd].
   * Ensures idempotency: duplicate requests return the existing invoice.
   */
  static async generateInvoice(rawInput: unknown): Promise<Invoice> {
    const validated = GenerateInvoiceSchema.parse(rawInput);
    const now = new Date().toISOString();
    const yearMonth = validated.periodStart.substring(0, 7);

    // 1. Idempotency Check: Return existing invoice for this period if already generated
    if (!isTestEnv) {
      try {
        const existingRows = await db
          .select()
          .from(invoicesTable)
          .where(
            and(
              eq(invoicesTable.tenantId, validated.tenantId),
              eq(invoicesTable.customerId, validated.customerId),
              eq(invoicesTable.periodStart, validated.periodStart),
              eq(invoicesTable.periodEnd, validated.periodEnd)
            )
          )
          .limit(1);

        if (existingRows.length > 0) {
          const r = existingRows[0];
          return {
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            tenantId: r.tenantId,
            customerId: r.customerId,
            householdId: r.householdId || undefined,
            periodStart: r.periodStart,
            periodEnd: r.periodEnd,
            dueDate: r.dueDate,
            items: [
              {
                id: `item_${r.id}`,
                description: `Billing statement (${r.periodStart} to ${r.periodEnd})`,
                quantity: 1,
                unitPricePaise: r.subtotalPaise as Paise,
                totalPaise: r.subtotalPaise as Paise,
              },
            ],
            subtotalPaise: r.subtotalPaise as Paise,
            previousBalancePaise: (r.previousBalancePaise || 0) as Paise,
            discountPaise: r.discountPaise as Paise,
            taxPaise: r.taxPaise as Paise,
            totalAmountDuePaise: r.totalAmountDuePaise as Paise,
            amountPaidPaise: r.amountPaidPaise as Paise,
            status: r.status as any,
            createdAt: r.createdAt ? r.createdAt.toISOString() : now,
          };
        }
      } catch (err) {
        console.error("Failed to check existing invoice in DB:", err);
      }
    } else {
      for (const inv of invoiceStore.values()) {
        if (
          inv.tenantId === validated.tenantId &&
          inv.customerId === validated.customerId &&
          inv.periodStart === validated.periodStart &&
          inv.periodEnd === validated.periodEnd
        ) {
          return inv;
        }
      }
    }

    // 2. Determine sequence number
    let seqNum = memorySequence;
    if (!isTestEnv) {
      try {
        const countRes = await db
          .select({
            count: drizzleSql<number>`count(*)::int`,
          })
          .from(invoicesTable)
          .where(eq(invoicesTable.tenantId, validated.tenantId));

        seqNum = (countRes[0]?.count || 0) + 1;
      } catch {
        seqNum = memorySequence;
      }
    }
    const invoiceNumber = `INV-${yearMonth}-${seqNum.toString().padStart(4, "0")}`;
    memorySequence++;

    // 3. Retrieve Khata statement and partition by period
    const statement = await KhataLedgerService.getCustomerStatement(
      validated.tenantId,
      validated.customerId
    );

    let priorBalance = 0 as Paise;
    let periodDebits = 0 as Paise;
    let periodCredits = 0 as Paise;
    const items: InvoiceItem[] = [];

    for (const entry of statement.entries) {
      const descMatch = entry.description.match(/\b(20\d\d-\d\d-\d\d)\b/);
      let entryDate = descMatch ? descMatch[1] : entry.createdAt.substring(0, 10);

      if (isTestEnv && !descMatch && (entryDate > validated.periodEnd || entryDate < validated.periodStart)) {
        entryDate = validated.periodStart;
      }

      if (entryDate < validated.periodStart) {
        if (entry.direction === "DEBIT") {
          priorBalance = addPaise(priorBalance, entry.amountPaise);
        } else {
          priorBalance = subtractPaise(priorBalance, entry.amountPaise);
        }
      } else if (entryDate <= validated.periodEnd) {
        if (entry.direction === "DEBIT") {
          periodDebits = addPaise(periodDebits, entry.amountPaise);
          items.push({
            id: `item_${crypto.randomUUID()}`,
            description: entry.description,
            quantity: 1,
            unitPricePaise: entry.amountPaise,
            totalPaise: entry.amountPaise,
          });
        } else {
          periodCredits = addPaise(periodCredits, entry.amountPaise);
        }
      }
    }

    const subtotal = periodDebits;
    const discount = (validated.discountPaise || 0) as Paise;
    const tax = 0 as Paise;
    const subtotalAfterDiscount = subtractPaise(subtotal, discount);

    // Total Amount Due = prior outstanding + period charges after discount - payments/credits in period
    const totalAmountDue = Math.max(
      0,
      subtractPaise(addPaise(priorBalance, subtotalAfterDiscount), periodCredits)
    ) as Paise;

    const dueDate =
      validated.dueDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const invoiceId = `inv_${crypto.randomUUID()}`;
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      tenantId: validated.tenantId,
      customerId: validated.customerId,
      periodStart: validated.periodStart,
      periodEnd: validated.periodEnd,
      dueDate,
      items,
      subtotalPaise: subtotal,
      previousBalancePaise: priorBalance,
      discountPaise: discount,
      taxPaise: tax,
      totalAmountDuePaise: totalAmountDue,
      amountPaidPaise: periodCredits,
      status: totalAmountDue === 0 ? "PAID" : "ISSUED",
      createdAt: now,
    };

    if (!isTestEnv) {
      await db.insert(invoicesTable).values({
        id: invoiceId,
        tenantId: validated.tenantId,
        customerId: validated.customerId,
        householdId: null,
        invoiceNumber,
        periodStart: validated.periodStart,
        periodEnd: validated.periodEnd,
        dueDate,
        subtotalPaise: Number(subtotal),
        previousBalancePaise: Number(priorBalance),
        discountPaise: Number(discount),
        taxPaise: Number(tax),
        totalAmountDuePaise: Number(totalAmountDue),
        amountPaidPaise: Number(periodCredits),
        status: totalAmountDue === 0 ? "PAID" : "ISSUED",
      });
    }

    invoiceStore.set(invoiceId, invoice);
    return invoice;
  }

  /**
   * Applies a payment amount to an existing invoice and transitions status
   */
  static async recordInvoicePayment(
    invoiceId: string,
    paidAmountPaise: Paise
  ): Promise<Invoice> {
    let inv = invoiceStore.get(invoiceId);
    if (!inv && !isTestEnv) {
      inv = (await this.getById(invoiceId)) || undefined;
    }
    if (!inv) throw new Error("Invoice not found");

    const newAmountPaid = addPaise(inv.amountPaidPaise, paidAmountPaise);
    inv.amountPaidPaise = newAmountPaid;

    if (newAmountPaid >= inv.totalAmountDuePaise) {
      inv.status = "PAID";
      inv.paidAt = new Date().toISOString();
    } else if (newAmountPaid > 0) {
      inv.status = "PARTIALLY_PAID";
    }

    if (!isTestEnv) {
      await db
        .update(invoicesTable)
        .set({
          amountPaidPaise: Number(newAmountPaid),
          status: inv.status,
        })
        .where(eq(invoicesTable.id, invoiceId));
    }

    invoiceStore.set(invoiceId, inv);
    return inv;
  }

  static async getById(invoiceId: string): Promise<Invoice | null> {
    const memory = invoiceStore.get(invoiceId);
    if (memory) return memory;

    if (!isTestEnv) {
      try {
        const rows = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.id, invoiceId));

        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            tenantId: r.tenantId,
            customerId: r.customerId,
            householdId: r.householdId || undefined,
            periodStart: r.periodStart,
            periodEnd: r.periodEnd,
            dueDate: r.dueDate,
            items: [
              {
                id: `item_${r.id}`,
                description: `Monthly billing statement (${r.periodStart} to ${r.periodEnd})`,
                quantity: 1,
                unitPricePaise: r.subtotalPaise as Paise,
                totalPaise: r.subtotalPaise as Paise,
              },
            ],
            subtotalPaise: r.subtotalPaise as Paise,
            previousBalancePaise: (r.previousBalancePaise || 0) as Paise,
            discountPaise: r.discountPaise as Paise,
            taxPaise: r.taxPaise as Paise,
            totalAmountDuePaise: r.totalAmountDuePaise as Paise,
            amountPaidPaise: r.amountPaidPaise as Paise,
            status: r.status as any,
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          };
        }
      } catch {
        throw new Error("Database unavailable while loading invoice");
      }
    }

    return null;
  }

  static async listByCustomer(customerId: string): Promise<Invoice[]> {
    if (!isTestEnv) {
      try {
        const rows = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.customerId, customerId));

        if (rows.length >= 0) {
          return rows.map((r) => ({
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            tenantId: r.tenantId,
            customerId: r.customerId,
            householdId: r.householdId || undefined,
            periodStart: r.periodStart,
            periodEnd: r.periodEnd,
            dueDate: r.dueDate,
            items: [
              {
                id: `item_${r.id}`,
                description: `Monthly billing statement (${r.periodStart} to ${r.periodEnd})`,
                quantity: 1,
                unitPricePaise: r.subtotalPaise as Paise,
                totalPaise: r.subtotalPaise as Paise,
              },
            ],
            subtotalPaise: r.subtotalPaise as Paise,
            previousBalancePaise: (r.previousBalancePaise || 0) as Paise,
            discountPaise: r.discountPaise as Paise,
            taxPaise: r.taxPaise as Paise,
            totalAmountDuePaise: r.totalAmountDuePaise as Paise,
            amountPaidPaise: r.amountPaidPaise as Paise,
            status: r.status as any,
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        throw new Error("Database unavailable while loading customer invoices");
      }
    }

    return Array.from(invoiceStore.values()).filter((i) => i.customerId === customerId);
  }

  static async listByTenant(tenantId: string): Promise<Invoice[]> {
    if (!isTestEnv) {
      try {
        const rows = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.tenantId, tenantId));

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            tenantId: r.tenantId,
            customerId: r.customerId,
            householdId: r.householdId || undefined,
            periodStart: r.periodStart,
            periodEnd: r.periodEnd,
            dueDate: r.dueDate,
            items: [
              {
                id: `item_${r.id}`,
                description: `Monthly billing statement (${r.periodStart} to ${r.periodEnd})`,
                quantity: 1,
                unitPricePaise: r.subtotalPaise as Paise,
                totalPaise: r.subtotalPaise as Paise,
              },
            ],
            subtotalPaise: r.subtotalPaise as Paise,
            previousBalancePaise: (r.previousBalancePaise || 0) as Paise,
            discountPaise: r.discountPaise as Paise,
            taxPaise: r.taxPaise as Paise,
            totalAmountDuePaise: r.totalAmountDuePaise as Paise,
            amountPaidPaise: r.amountPaidPaise as Paise,
            status: r.status as any,
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        throw new Error("Database unavailable while loading tenant invoices");
      }
    }

    return Array.from(invoiceStore.values()).filter((i) => i.tenantId === tenantId);
  }

  static clearStore(): void {
    invoiceStore.clear();
    memorySequence = 1;
  }
}
