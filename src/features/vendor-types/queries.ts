import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { toVendorType, type VendorType } from "@/core/vendor-types";
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
