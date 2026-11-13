import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { storeSettings, storeShippingZones } from "@/db/schema";
import type { ShippingZoneRule } from "@/core/store";
import type { PublicStoreSettings, StoreSettings } from "./types";

/**
 * Shared plumbing for the RUXs Store engines: database handle types, the
 * settings row and the shipping zones. No auth here: callers guard.
 */

export type StoreDb = ReturnType<typeof getDb>;
export type StoreTx = Parameters<Parameters<StoreDb["transaction"]>[0]>[0];
export type StoreConn = StoreDb | StoreTx;

/** A rule broke inside a transaction: rolls it back and becomes a user-facing error. */
export class StoreRuleError extends Error {}

export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

const DEFAULT_SETTINGS: StoreSettings = {
  isOpen: true,
  closedMessage: null,
  codEnabled: true,
  codMaxPaise: 300000,
  deliveryFeePaise: 4000,
  freeDeliveryAbovePaise: 49900,
  minOrderPaise: 0,
  serviceability: "india",
  serviceCity: "Ranchi",
  serviceLatitude: 23.3441,
  serviceLongitude: 85.3096,
  serviceRadiusKm: 25,
  dispatchDays: 1,
  defaultEtaMinDays: 3,
  defaultEtaMaxDays: 7,
  returnWindowDays: 7,
  autoForward: false,
  updatedBy: null,
  updatedAt: null,
};

/** The single settings row, or safe defaults when the row is missing. */
export async function loadStoreSettings(db: StoreConn): Promise<StoreSettings> {
  const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (!row) return DEFAULT_SETTINGS;
  return {
    isOpen: row.isOpen,
    closedMessage: row.closedMessage,
    codEnabled: row.codEnabled,
    codMaxPaise: row.codMaxPaise,
    deliveryFeePaise: row.deliveryFeePaise,
    freeDeliveryAbovePaise: row.freeDeliveryAbovePaise,
    minOrderPaise: row.minOrderPaise,
    serviceability: row.serviceability === "geofence" ? "geofence" : "india",
    serviceCity: row.serviceCity,
    serviceLatitude: row.serviceLatitude,
    serviceLongitude: row.serviceLongitude,
    serviceRadiusKm: row.serviceRadiusKm,
    dispatchDays: row.dispatchDays,
    defaultEtaMinDays: row.defaultEtaMinDays,
    defaultEtaMaxDays: row.defaultEtaMaxDays,
    returnWindowDays: row.returnWindowDays,
    autoForward: row.autoForward,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}

/** What households may see. Leaves out everything internal (auto-forward, geofence centre). */
export function toPublicSettings(s: StoreSettings): PublicStoreSettings {
  return {
    isOpen: s.isOpen,
    closedMessage: s.closedMessage,
    codEnabled: s.codEnabled,
    codMaxPaise: s.codMaxPaise,
    deliveryFeePaise: s.deliveryFeePaise,
    freeDeliveryAbovePaise: s.freeDeliveryAbovePaise,
    minOrderPaise: s.minOrderPaise,
    serviceability: s.serviceability,
    serviceCity: s.serviceCity,
    dispatchDays: s.dispatchDays,
    defaultEtaMinDays: s.defaultEtaMinDays,
    defaultEtaMaxDays: s.defaultEtaMaxDays,
    returnWindowDays: s.returnWindowDays,
  };
}

/** Active shipping zones as rules for core/store resolveShippingZone. */
export async function loadShippingZones(db: StoreConn): Promise<ShippingZoneRule[]> {
  const rows = await db
    .select()
    .from(storeShippingZones)
    .where(eq(storeShippingZones.isActive, true))
    .orderBy(asc(storeShippingZones.sort), asc(storeShippingZones.name));
  return rows.map((z) => ({
    id: z.id,
    name: z.name,
    pinPrefixes: z.pinPrefixes,
    states: z.states,
    feePaise: z.feePaise,
    freeAbovePaise: z.freeAbovePaise,
    etaMinDays: z.etaMinDays,
    etaMaxDays: z.etaMaxDays,
    codAllowed: z.codAllowed,
    isActive: z.isActive,
    sort: z.sort,
  }));
}
