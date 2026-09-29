import {
  AssetHolding,
  AssetLedgerEntry,
  AssetType,
  RecordAssetExchangeSchema,
} from "./asset-schema";
import { KhataLedgerService } from "../khata/khata-ledger";
import { Paise } from "../../shared/types/money";
import { db, isTestEnv, assetHoldings as assetHoldingsTable, assetMovements as assetMovementsTable } from "../../shared/db";
import { and, eq } from "drizzle-orm";

const holdingsStore = new Map<string, AssetHolding>();
const ledgerStore = new Map<string, AssetLedgerEntry[]>();

export class AssetLedgerService {
  private static getKey(tenantId: string, customerId: string, assetType: AssetType): string {
    return `${tenantId}:${customerId}:${assetType}`;
  }

  static async recordExchange(rawInput: unknown): Promise<{ holding: AssetHolding; entry: AssetLedgerEntry }> {
    const validated = RecordAssetExchangeSchema.parse(rawInput);
    const key = this.getKey(validated.tenantId, validated.customerId, validated.assetType);
    let holding = holdingsStore.get(key);

    if (!holding && !isTestEnv) {
      const rows = await db.select().from(assetHoldingsTable).where(and(
        eq(assetHoldingsTable.tenantId, validated.tenantId),
        eq(assetHoldingsTable.customerId, validated.customerId),
        eq(assetHoldingsTable.assetType, validated.assetType),
      )).limit(1);
      const row = rows[0];
      if (row) {
        holding = {
          tenantId: row.tenantId,
          customerId: row.customerId,
          assetType: row.assetType as AssetType,
          holdingCount: row.holdingCount,
          depositPerUnitPaise: row.depositPerUnitPaise as Paise,
          totalDepositHeldPaise: row.totalDepositHeldPaise as Paise,
          updatedAt: row.updatedAt.toISOString(),
        };
      }
    }

    holding ??= {
      tenantId: validated.tenantId,
      customerId: validated.customerId,
      assetType: validated.assetType,
      holdingCount: 0,
      depositPerUnitPaise: 15000 as Paise,
      totalDepositHeldPaise: 0 as Paise,
      updatedAt: new Date().toISOString(),
    };

    const netDelta = validated.quantityDelivered - validated.quantityCollected;
    const resultingHolding = holding.holdingCount + netDelta;
    if (resultingHolding < 0) {
      throw new Error(`Invalid exchange: cannot collect ${validated.quantityCollected} containers when customer holds only ${holding.holdingCount}`);
    }

    const now = new Date();
    const updatedHolding: AssetHolding = {
      ...holding,
      holdingCount: resultingHolding,
      totalDepositHeldPaise: (resultingHolding * holding.depositPerUnitPaise) as Paise,
      updatedAt: now.toISOString(),
    };
    const entry: AssetLedgerEntry = {
      id: `asl_${crypto.randomUUID()}`,
      tenantId: validated.tenantId,
      customerId: validated.customerId,
      assetType: validated.assetType,
      quantityDelivered: validated.quantityDelivered,
      quantityCollected: validated.quantityCollected,
      netDelta,
      resultingHoldingCount: resultingHolding,
      fulfillmentId: validated.fulfillmentId,
      notes: validated.notes,
      createdAt: now.toISOString(),
    };

    if (!isTestEnv) {
      const existing = await db.select({ id: assetHoldingsTable.id })
        .from(assetHoldingsTable)
        .where(and(
          eq(assetHoldingsTable.tenantId, validated.tenantId),
          eq(assetHoldingsTable.customerId, validated.customerId),
          eq(assetHoldingsTable.assetType, validated.assetType),
        )).limit(1);

      if (existing[0]) {
        await db.update(assetHoldingsTable).set({
          holdingCount: updatedHolding.holdingCount,
          totalDepositHeldPaise: Number(updatedHolding.totalDepositHeldPaise),
          updatedAt: now,
        }).where(eq(assetHoldingsTable.id, existing[0].id));
      } else {
        await db.insert(assetHoldingsTable).values({
          id: crypto.randomUUID(),
          tenantId: updatedHolding.tenantId,
          customerId: updatedHolding.customerId,
          assetType: updatedHolding.assetType,
          holdingCount: updatedHolding.holdingCount,
          depositPerUnitPaise: Number(updatedHolding.depositPerUnitPaise),
          totalDepositHeldPaise: Number(updatedHolding.totalDepositHeldPaise),
          updatedAt: now,
        });
      }

      await db.insert(assetMovementsTable).values({
        id: entry.id,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        assetType: entry.assetType,
        quantityDelivered: entry.quantityDelivered,
        quantityCollected: entry.quantityCollected,
        netDelta: entry.netDelta,
        resultingHoldingCount: entry.resultingHoldingCount,
        fulfillmentId: entry.fulfillmentId || null,
        notes: entry.notes || null,
        createdAt: now,
      });
    }

    holdingsStore.set(key, updatedHolding);
    const entries = ledgerStore.get(key) || [];
    entries.push(entry);
    ledgerStore.set(key, entries);

    return { holding: updatedHolding, entry };
  }

  static async reconcileAndRefundDeposit(tenantId: string, customerId: string, assetType: AssetType) {
    const holding = await this.getHoldingAsync(tenantId, customerId, assetType);
    if (!holding || holding.holdingCount === 0) {
      return { refunded: false, message: "No containers or active deposits found for this customer", refundPaise: 0 as Paise };
    }

    throw new Error(`Cannot refund deposit: customer still holds ${holding.holdingCount} unreturned ${assetType} containers`);
  }

  static getHolding(tenantId: string, customerId: string, assetType: AssetType): AssetHolding | null {
    return holdingsStore.get(this.getKey(tenantId, customerId, assetType)) || null;
  }

  static async getHoldingAsync(tenantId: string, customerId: string, assetType: AssetType): Promise<AssetHolding | null> {
    const memory = this.getHolding(tenantId, customerId, assetType);
    if (memory) return memory;
    if (isTestEnv) return null;

    const rows = await db.select().from(assetHoldingsTable).where(and(
      eq(assetHoldingsTable.tenantId, tenantId),
      eq(assetHoldingsTable.customerId, customerId),
      eq(assetHoldingsTable.assetType, assetType),
    )).limit(1);
    const row = rows[0];
    if (!row) return null;

    const holding: AssetHolding = {
      tenantId: row.tenantId,
      customerId: row.customerId,
      assetType: row.assetType as AssetType,
      holdingCount: row.holdingCount,
      depositPerUnitPaise: row.depositPerUnitPaise as Paise,
      totalDepositHeldPaise: row.totalDepositHeldPaise as Paise,
      updatedAt: row.updatedAt.toISOString(),
    };
    holdingsStore.set(this.getKey(tenantId, customerId, assetType), holding);
    return holding;
  }

  static seedDefaultHoldingsIfEmpty(): void {
    if (holdingsStore.size > 0) return;
    if (!isTestEnv) return;

    const samples: AssetHolding[] = [
      { tenantId: "ten_pureaqua_water", customerId: "usr_priya", assetType: "WATER_JAR_20L", holdingCount: 2, depositPerUnitPaise: 15000 as Paise, totalDepositHeldPaise: 30000 as Paise, updatedAt: new Date().toISOString() },
      { tenantId: "ten_sharma_tiffin", customerId: "usr_priya", assetType: "TIFFIN_BOX_STEEL", holdingCount: 1, depositPerUnitPaise: 30000 as Paise, totalDepositHeldPaise: 30000 as Paise, updatedAt: new Date().toISOString() },
      { tenantId: "ten_pureaqua_water", customerId: "usr_verma", assetType: "WATER_JAR_20L", holdingCount: 3, depositPerUnitPaise: 15000 as Paise, totalDepositHeldPaise: 45000 as Paise, updatedAt: new Date().toISOString() },
    ];
    for (const sample of samples) holdingsStore.set(this.getKey(sample.tenantId, sample.customerId, sample.assetType), sample);
  }

  static listAllHoldings(): AssetHolding[] {
    this.seedDefaultHoldingsIfEmpty();
    return Array.from(holdingsStore.values());
  }

  static async listAllHoldingsAsync(): Promise<AssetHolding[]> {
    if (!isTestEnv) {
      const rows = await db.select().from(assetHoldingsTable);
      return rows.map((r) => ({
        tenantId: r.tenantId,
        customerId: r.customerId,
        assetType: r.assetType as AssetType,
        holdingCount: r.holdingCount,
        depositPerUnitPaise: r.depositPerUnitPaise as Paise,
        totalDepositHeldPaise: r.totalDepositHeldPaise as Paise,
        updatedAt: r.updatedAt.toISOString(),
      }));
    }
    return this.listAllHoldings();
  }

  static clearStore(): void {
    holdingsStore.clear();
    ledgerStore.clear();
  }
}
