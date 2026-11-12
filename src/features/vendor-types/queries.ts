import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityRules, kidsServices, products, services, vendors } from "@/db/schema";
import { requireVendorAccess, requireVendorModule } from "@/lib/auth/session";
import { VENDOR_TYPE_INFO, canUseModule, toVendorType, type VendorType } from "@/core/vendor-types";
import { ITEM_FIELDS, PROFILE_FIELDS, chipsFor, type FieldValues } from "./fields";
import { readItemDetails, readTypeProfile } from "./tables";

/** Merchant panel: this vendor's type and its type-specific profile values. */
export async function getMyTypeProfile(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const type = toVendorType(access.vendor.vendorType, access.vendor.businessType);
  const row = await readTypeProfile(getDb(), access.vendorId, type);
  return { type, values: pick(PROFILE_FIELDS[type], row) };
}

/** Merchant panel: per-item detail values for the given products or services. */
export async function getMyItemDetails(slug: string, ids: string[]) {
  const access = await requireVendorAccess(slug);
  const type = toVendorType(access.vendor.vendorType, access.vendor.businessType);
  const fields = ITEM_FIELDS[type];
  if (!fields) return { type, details: new Map<string, FieldValues>() };
  const rows = await readItemDetails(getDb(), access.vendorId, type, ids);
  return { type, details: new Map(Array.from(rows, ([id, row]) => [id, pick(fields, row)])) };
}

/** Household pages: profile highlights and per-item chips for a public store. */
export async function getPublicTypeDetails(vendorId: string, itemIds: string[]) {
  const db = getDb();
  const [vendor] = await db.select({ vendorType: vendors.vendorType, businessType: vendors.businessType }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) return { type: "store" as VendorType, highlights: [], itemChips: new Map<string, string[]>() };
  const type = toVendorType(vendor.vendorType, vendor.businessType);
  const [profile, items] = await Promise.all([readTypeProfile(db, vendorId, type), readItemDetails(db, vendorId, type, itemIds)]);
  const itemFields = ITEM_FIELDS[type] ?? [];
  return {
    type,
    profile,
    highlights: chipsFor(PROFILE_FIELDS[type], profile),
    itemChips: new Map(Array.from(items, ([id, row]) => [id, chipsFor(itemFields, row)])),
    itemRows: items,
  };
}

/**
 * Owner's "get ready to sell" steps for Today. Null for staff and drivers.
 * Counts the live catalogue, weekly hours (bookable types) and filled profile fields.
 */
export async function getSetupChecklist(slug: string) {
  const access = await requireVendorModule(slug, "today");
  if (access.role !== "owner") return null;
  const type = access.vendorType;
  const info = VENDOR_TYPE_INFO[type];
  const v = access.vendor;
  const db = getDb();
  const booking = info.fulfilment === "booking";
  const kidsClasses = canUseModule(type, "kids");

  const catalogueQuery = kidsClasses
    ? db.select({ n: count() }).from(kidsServices).where(and(eq(kidsServices.vendorId, v.id), isNull(kidsServices.archivedAt)))
    : booking
      ? db.select({ n: count() }).from(services).where(and(eq(services.vendorId, v.id), isNull(services.archivedAt)))
      : db.select({ n: count() }).from(products).where(and(eq(products.vendorId, v.id), isNull(products.archivedAt)));

  const [[catalogue], [hours], profile] = await Promise.all([
    catalogueQuery,
    booking ? db.select({ n: count() }).from(availabilityRules).where(eq(availabilityRules.vendorId, v.id)) : Promise.resolve([{ n: 1 }]),
    readTypeProfile(db, v.id, type),
  ]);

  const fields = PROFILE_FIELDS[type].filter((f) => f.kind !== "bool");
  const filledFields = fields.filter((f) => {
    const value = profile?.[f.key];
    return value != null && value !== "" && !(Array.isArray(value) && value.length === 0);
  }).length;

  return {
    type,
    info,
    vendor: v,
    booking,
    kidsClasses,
    catalogueCount: catalogue?.n ?? 0,
    hoursCount: hours?.n ?? 0,
    profileFieldCount: fields.length,
    filledFields,
  };
}

/** Only the keys the form knows, with paise shown as rupees. */
function pick(fields: (typeof PROFILE_FIELDS)[VendorType], row: Record<string, unknown> | null): FieldValues {
  const out: FieldValues = {};
  for (const f of fields) {
    const v = row?.[f.key];
    if (f.kind === "rupees") out[f.key] = typeof v === "number" ? v / 100 : null;
    else if (f.kind === "multi" || f.kind === "tags") out[f.key] = Array.isArray(v) ? (v as string[]) : [];
    else if (f.kind === "bool") out[f.key] = v === true;
    else if (f.kind === "select") out[f.key] = typeof v === "string" ? v : (f.options[0]?.value ?? "");
    else out[f.key] = (v as string | number | null | undefined) ?? null;
  }
  return out;
}
