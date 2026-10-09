import {
  KhataEntry,
  CreateKhataEntrySchema,
} from "./khata-schema";
import { Paise, addPaise, subtractPaise } from "../../shared/types/money";
import { db, isTestEnv } from "../../shared/db";
import { khataEntries as khataEntriesTable } from "../../shared/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";

// Append-only ledger store partitioned by [tenantId:customerId] (cache & test fixtures)
const ledgerStore = new Map<string, KhataEntry[]>();

export class KhataLedgerService {
  private static getPartitionKey(tenantId: string, customerId: string): string {
    return `${tenantId}:${customerId}`;
  }

  /**
   * Appends an immutable financial transaction into the digital Khata.
   * Derives previous balance authoritatively from PostgreSQL to prevent drift across worker isolates.
   * Enforces reference-level idempotency to prevent duplicate charges or payments.
   */
  static async recordEntry(rawInput: unknown): Promise<KhataEntry> {
    const validated = CreateKhataEntrySchema.parse(rawInput);
    const key = this.getPartitionKey(validated.tenantId, validated.customerId);
    const entries = ledgerStore.get(key) || [];

    // Idempotency Guard: prevent duplicate entries if reference is provided
    if (validated.referenceType && validated.referenceId) {
      if (!isTestEnv) {
        try {
          const existing = await db
            .select()
            .from(khataEntriesTable)
            .where(
              and(
                eq(khataEntriesTable.tenantId, validated.tenantId),
                eq(khataEntriesTable.referenceType, validated.referenceType),
                eq(khataEntriesTable.referenceId, validated.referenceId)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            const r = existing[0];
            return {
              id: r.id,
              tenantId: r.tenantId,
              customerId: r.customerId,
              householdId: r.householdId ?? undefined,
              entryType: r.entryType as any,
              direction: r.direction as any,
              amountPaise: r.amountPaise as Paise,
              runningBalancePaise: r.runningBalancePaise as Paise,
              referenceType: r.referenceType as any,
              referenceId: r.referenceId ?? undefined,
              description: r.description,
              createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
            };
          }
        } catch (err) {
          console.error("Failed to check idempotency in khata:", err);
        }
      } else {
        const memExisting = entries.find(
          (e) =>
            e.referenceType === validated.referenceType &&
            e.referenceId === validated.referenceId
        );
        if (memExisting) return memExisting;
      }
    }

    // Authoritative balance derivation
    let currentBalance: Paise = 0 as Paise;

    if (!isTestEnv) {
      try {
        const latestRows = await db
          .select({
            runningBalancePaise: khataEntriesTable.runningBalancePaise,
          })
          .from(khataEntriesTable)
          .where(
            and(
              eq(khataEntriesTable.tenantId, validated.tenantId),
              eq(khataEntriesTable.customerId, validated.customerId)
            )
          )
          .orderBy(desc(khataEntriesTable.createdAt))
          .limit(1);

        if (latestRows.length > 0) {
          currentBalance = latestRows[0].runningBalancePaise as Paise;
        } else if (entries.length > 0) {
          currentBalance = entries[entries.length - 1].runningBalancePaise;
        }
      } catch (err) {
        console.error("Failed to query latest khata balance, falling back to cache:", err);
        if (entries.length > 0) {
          currentBalance = entries[entries.length - 1].runningBalancePaise;
        }
      }
    } else {
      if (entries.length > 0) {
        currentBalance = entries[entries.length - 1].runningBalancePaise;
      }
    }

    const amount = validated.amountPaise as Paise;
    let newBalance: Paise;

    if (validated.direction === "DEBIT") {
      newBalance = addPaise(currentBalance, amount);
    } else {
      newBalance = subtractPaise(currentBalance, amount);
    }

    const entryId = `kht_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newEntry: KhataEntry = {
      id: entryId,
      tenantId: validated.tenantId,
      customerId: validated.customerId,
      householdId: validated.householdId,
      entryType: validated.entryType,
      direction: validated.direction,
      amountPaise: amount,
      runningBalancePaise: newBalance,
      referenceType: validated.referenceType,
      referenceId: validated.referenceId,
      description: validated.description,
      createdAt: now,
    };

    if (!isTestEnv) {
      await db.insert(khataEntriesTable).values({
        id: entryId,
        tenantId: validated.tenantId,
        customerId: validated.customerId,
        householdId: validated.householdId || null,
        entryType: validated.entryType,
        direction: validated.direction,
        amountPaise: Number(amount),
        runningBalancePaise: Number(newBalance),
        referenceType: validated.referenceType || null,
        referenceId: validated.referenceId || null,
        description: validated.description,
      });
    }

    entries.push(newEntry);
    ledgerStore.set(key, entries);
    return newEntry;
  }

  /**
   * Retrieves full transactional statement for a customer scoped strictly by tenantId
   */
  static async getCustomerStatement(tenantId: string, customerId: string): Promise<{
    entries: KhataEntry[];
    currentBalancePaise: Paise;
    totalDebitsPaise: Paise;
    totalCreditsPaise: Paise;
  }> {
    if (!isTestEnv) {
      try {
        const dbRows = await db
          .select()
          .from(khataEntriesTable)
          .where(
            and(
              eq(khataEntriesTable.tenantId, tenantId),
              eq(khataEntriesTable.customerId, customerId)
            )
          )
          .orderBy(asc(khataEntriesTable.createdAt));

        if (dbRows && dbRows.length > 0) {
          const entries: KhataEntry[] = dbRows.map((r) => ({
            id: r.id,
            tenantId: r.tenantId,
            customerId: r.customerId,
            householdId: r.householdId ?? undefined,
            entryType: r.entryType as any,
            direction: r.direction as any,
            amountPaise: r.amountPaise as Paise,
            runningBalancePaise: r.runningBalancePaise as Paise,
            referenceType: r.referenceType as any,
            referenceId: r.referenceId ?? undefined,
            description: r.description,
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          }));

          let totalDebits = 0 as Paise;
          let totalCredits = 0 as Paise;

          for (const e of entries) {
            if (e.direction === "DEBIT") {
              totalDebits = addPaise(totalDebits, e.amountPaise);
            } else {
              totalCredits = addPaise(totalCredits, e.amountPaise);
            }
          }

          const derivedBalance = subtractPaise(totalDebits, totalCredits);

          return {
            entries,
            currentBalancePaise: derivedBalance,
            totalDebitsPaise: totalDebits,
            totalCreditsPaise: totalCredits,
          };
        }
      } catch {
        throw new Error("Database unavailable while loading account statement");
      }
    }

    const key = this.getPartitionKey(tenantId, customerId);
    const entries = ledgerStore.get(key) || [];

    let totalDebits = 0 as Paise;
    let totalCredits = 0 as Paise;

    for (const e of entries) {
      if (e.direction === "DEBIT") {
        totalDebits = addPaise(totalDebits, e.amountPaise);
      } else {
        totalCredits = addPaise(totalCredits, e.amountPaise);
      }
    }

    const derivedBalance = subtractPaise(totalDebits, totalCredits);

    return {
      entries,
      currentBalancePaise: derivedBalance,
      totalDebitsPaise: totalDebits,
      totalCreditsPaise: totalCredits,
    };
  }

  /**
   * Verifies mathematical integrity in-memory
   */
  static verifyIntegrity(tenantId: string, customerId: string): boolean {
    const key = this.getPartitionKey(tenantId, customerId);
    const entries = ledgerStore.get(key) || [];

    let cumulative = 0 as Paise;
    for (const e of entries) {
      if (e.direction === "DEBIT") {
        cumulative = addPaise(cumulative, e.amountPaise);
      } else {
        cumulative = subtractPaise(cumulative, e.amountPaise);
      }

      if (cumulative !== e.runningBalancePaise) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifies mathematical integrity authoritatively from PostgreSQL
   */
  static async verifyIntegrityAsync(tenantId: string, customerId: string): Promise<boolean> {
    const statement = await this.getCustomerStatement(tenantId, customerId);
    let cumulative = 0 as Paise;

    for (const e of statement.entries) {
      if (e.direction === "DEBIT") {
        cumulative = addPaise(cumulative, e.amountPaise);
      } else {
        cumulative = subtractPaise(cumulative, e.amountPaise);
      }

      if (cumulative !== e.runningBalancePaise) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieves net outstanding khata balance for a customer.
   * Strictly scopes by tenantId when provided to avoid cross-tenant balance leakage.
   */
  static async getBalance(arg1: string, arg2?: string): Promise<number> {
    let tenantId: string | undefined;
    let customerId: string;

    if (arg2) {
      tenantId = arg1;
      customerId = arg2;
    } else {
      customerId = arg1;
    }

    if (!isTestEnv) {
      try {
        const conditions = [eq(khataEntriesTable.customerId, customerId)];
        if (tenantId) {
          conditions.push(eq(khataEntriesTable.tenantId, tenantId));
        }

        const dbRows = await db
          .select({
            direction: khataEntriesTable.direction,
            amountPaise: khataEntriesTable.amountPaise,
          })
          .from(khataEntriesTable)
          .where(and(...conditions));

        if (dbRows && dbRows.length > 0) {
          let bal = 0;
          for (const r of dbRows) {
            if (r.direction === "DEBIT") {
              bal += Number(r.amountPaise);
            } else {
              bal -= Number(r.amountPaise);
            }
          }
          return bal;
        }
      } catch {
        throw new Error("Database unavailable while loading account balance");
      }
    }

    let bal = 0;
    for (const [key, entries] of ledgerStore.entries()) {
      if (tenantId) {
        if (key === `${tenantId}:${customerId}`) {
          for (const e of entries) {
            if (e.direction === "DEBIT") {
              bal += Number(e.amountPaise);
            } else {
              bal -= Number(e.amountPaise);
            }
          }
        }
      } else if (key.endsWith(`:${customerId}`)) {
        for (const e of entries) {
          if (e.direction === "DEBIT") {
            bal += Number(e.amountPaise);
          } else {
            bal -= Number(e.amountPaise);
          }
        }
      }
    }
    return bal;
  }

  static clearStore(): void {
    ledgerStore.clear();
  }
}
