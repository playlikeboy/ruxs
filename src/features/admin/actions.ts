"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, ledgerEntries, localities, platformAdmins, platformSettings, vendorApplications, vendorMembers, vendors } from "@/db/schema";
import { VENDOR_TYPE_INFO, isVendorType, vendorTypeForCategory } from "@/core/vendor-types";
import { provisionTypeProfile } from "@/features/vendor-types/tables";
import { requireAdmin } from "@/lib/auth/session";
import { hexclave } from "@/lib/auth/hexclave";
import { rupeesToPaise } from "@/core/money";
import { merchantLoginEmail } from "@/core/merchant-login";
import {
  adminEmailSchema,
  adminIdSchema,
  bulkVendorIdsSchema,
  bulkVendorStatusSchema,
  categorySchema,
  createVendorSchema,
  discoverySchema,
  localitySchema,
  loginIdSchema,
  toggleAcceptingOrdersSchema,
  updateVendorSchema,
  vendorIdSchema,
  vendorStatusSchema,
} from "./schemas";

function fail(error: string) {
  return { ok: false as const, error };
}

function firstIssue(e: { issues: { message: string }[] }) {
  return e.issues[0]?.message ?? "Invalid input";
}

/** 14 characters from an alphabet without look-alikes (0/O, 1/l/I). */
function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(14);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

function detailsToColumns(d: {
  name: string;
  phone: string;
  upiVpa: string;
  city: string;
  area: string;
  description?: string;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  deliveryFeeRupees: number;
  minOrderRupees: number;
  commissionPercent: number;
  mapsUrl?: string;
}) {
  return {
    name: d.name,
    phone: d.phone,
    upiVpa: d.upiVpa,
    city: d.city,
    area: d.area,
    description: d.description || null,
    latitude: d.latitude,
    longitude: d.longitude,
    serviceRadiusKm: d.serviceRadiusKm,
    deliveryFeePaise: rupeesToPaise(d.deliveryFeeRupees),
    minOrderPaise: rupeesToPaise(d.minOrderRupees),
    commissionBps: Math.round(d.commissionPercent * 100),
    mapsUrl: d.mapsUrl || null,
  };
}

export interface Credentials {
  loginId: string;
  password: string;
  loginUrl: string;
}

/**
 * Creates or resets the owner login for a vendor: login id = store slug,
 * password freshly generated and shown once. Passwords are never stored by RUXs.
 */
async function issueCredentials(vendorId: string): Promise<{ ok: true; credentials: Credentials } | { ok: false; error: string }> {
  const db = getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) return fail("Vendor not found");

  const loginId = vendor.loginId ?? vendor.slug;
  const password = generatePassword();
  let userId = vendor.loginUserId;

  try {
    const existing = userId ? await hexclave.getUser(userId) : null;
    if (existing) {
      await existing.update({ password });
    } else {
      const created = await hexclave.createUser({
        primaryEmail: merchantLoginEmail(loginId),
        primaryEmailVerified: true,
        primaryEmailAuthEnabled: true,
        password,
        displayName: vendor.name,
      });
      userId = created.id;
    }
  } catch (err) {
    return fail("Login service error: " + (err instanceof Error ? err.message : String(err)));
  }

  await db.update(vendors).set({ loginId, loginUserId: userId, updatedAt: new Date() }).where(eq(vendors.id, vendor.id));
  await db.insert(vendorMembers).values({ vendorId: vendor.id, userId: userId!, role: "owner" }).onConflictDoNothing();

  return {
    ok: true,
    credentials: { loginId, password, loginUrl: (process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in") + "/merchant-panel/sign-in" },
  };
}

export async function adminCreateVendor(input: unknown) {
  const parsed = createVendorSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();

  const [taken] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.slug, parsed.data.slug)).limit(1);
  if (taken) return fail("That store URL is already used. Pick another.");

  // The category decides the vendor type, which decides its tables and tools.
  const [category] = await db
    .select({ fulfilment: categories.fulfilment, vendorType: categories.vendorType })
    .from(categories)
    .where(eq(categories.id, parsed.data.categoryId))
    .limit(1);
  const vendorType = category && isVendorType(category.vendorType)
    ? category.vendorType
    : vendorTypeForCategory(parsed.data.categoryId);
  const businessType = VENDOR_TYPE_INFO[vendorType].fulfilment;

  const vendor = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(vendors)
      .values({ ...detailsToColumns(parsed.data), slug: parsed.data.slug, businessType, vendorType, categoryId: parsed.data.categoryId, plan: "free", status: "active" })
      .returning({ id: vendors.id });
    await provisionTypeProfile(tx, row!.id, vendorType);
    return row;
  });

  if (parsed.data.applicationId) {
    await db
      .update(vendorApplications)
      .set({ status: "approved", vendorId: vendor!.id, updatedAt: new Date() })
      .where(eq(vendorApplications.id, parsed.data.applicationId));
  }
  const issued = await issueCredentials(vendor!.id);
  revalidatePath("/admin", "layout");
  if (!issued.ok) return { ok: true as const, vendorId: vendor!.id, credentials: null, warning: issued.error };
  return { ok: true as const, vendorId: vendor!.id, credentials: issued.credentials, warning: null };
}

export async function adminUpdateVendor(input: unknown) {
  const parsed = updateVendorSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();
  const { vendorId, plan, acceptingOrders, ...details } = parsed.data;

  const [updated] = await db
    .update(vendors)
    .set({ ...detailsToColumns(details), plan, acceptingOrders, updatedAt: new Date() })
    .where(eq(vendors.id, vendorId))
    .returning({ slug: vendors.slug });
  if (!updated) return fail("Vendor not found");

  revalidatePath("/admin", "layout");
  revalidatePath(`/app/store/${updated.slug}`);
  return { ok: true as const };
}

export async function adminGenerateCredentials(input: unknown) {
  const parsed = vendorIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  await requireAdmin();
  const issued = await issueCredentials(parsed.data.vendorId);
  revalidatePath(`/admin/vendors/${parsed.data.vendorId}`);
  return issued;
}

/** Changes the ID a merchant signs in with. The password stays the same. */
export async function adminSetLoginId(input: unknown) {
  const parsed = loginIdSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();
  const { vendorId, loginId } = parsed.data;
  const [vendor] = await db.select({ id: vendors.id, loginUserId: vendors.loginUserId }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor?.loginUserId) return fail("Generate a login first.");
  const [taken] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.loginId, loginId)).limit(1);
  if (taken && taken.id !== vendor.id) return fail("That login ID is already used by another store.");
  try {
    const user = await hexclave.getUser(vendor.loginUserId);
    if (!user) return fail("The login account is missing. Generate a new login.");
    await user.setPrimaryEmail(merchantLoginEmail(loginId), { verified: true });
  } catch (err) {
    return fail("Login service error: " + (err instanceof Error ? err.message : String(err)));
  }
  await db.update(vendors).set({ loginId, updatedAt: new Date() }).where(eq(vendors.id, vendor.id));
  revalidatePath(`/admin/vendors/${vendor.id}`);
  return { ok: true as const, loginId };
}

export async function adminSetVendorStatus(input: unknown) {
  const parsed = vendorStatusSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  await requireAdmin();
  const db = getDb();
  const [updated] = await db
    .update(vendors)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(vendors.id, parsed.data.vendorId))
    .returning({ id: vendors.id });
  if (!updated) return fail("Vendor not found");
  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function adminToggleAcceptingOrders(input: unknown) {
  const parsed = toggleAcceptingOrdersSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();
  const [updated] = await db
    .update(vendors)
    .set({ acceptingOrders: parsed.data.acceptingOrders, updatedAt: new Date() })
    .where(eq(vendors.id, parsed.data.vendorId))
    .returning({ id: vendors.id, acceptingOrders: vendors.acceptingOrders });
  if (!updated) return fail("Vendor not found");
  revalidatePath("/admin", "layout");
  return { ok: true as const, acceptingOrders: updated.acceptingOrders };
}

export async function adminDeleteVendor(input: unknown) {
  const parsed = vendorIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid vendor ID");
  await requireAdmin();
  const db = getDb();

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, parsed.data.vendorId))
    .limit(1);
  if (!vendor) return fail("Vendor not found");

  // Check if vendor has immutable financial ledger entries
  const [hasLedger] = await db
    .select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.vendorId, vendor.id))
    .limit(1);

  if (hasLedger) {
    // Due to ledger immutability trigger (0001_ledger_immutability.sql), financial records cannot be deleted.
    // Deactivate & suspend the store instead so it cannot operate or appear in search/orders.
    await db
      .update(vendors)
      .set({
        status: "suspended",
        acceptingOrders: false,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendor.id));

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/vendors");
    return {
      ok: false as const,
      protectedByLedger: true,
      error: `Store "${vendor.name}" has permanent financial ledger records and cannot be permanently deleted. The store has been deactivated and suspended instead.`,
    };
  }

  // Safe to delete! Postgres foreign key cascades remove products, type profiles, members, etc.
  await db.delete(vendors).where(eq(vendors.id, vendor.id));

  if (vendor.loginUserId) {
    try {
      const existingUser = await hexclave.getUser(vendor.loginUserId);
      if (existingUser) await existingUser.delete();
    } catch {
      // ignore if already deleted
    }
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/vendors");
  return { ok: true as const, message: `Store "${vendor.name}" was permanently deleted.` };
}

export async function adminBulkSetVendorStatus(input: unknown) {
  const parsed = bulkVendorStatusSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();

  await db
    .update(vendors)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(inArray(vendors.id, parsed.data.vendorIds));

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/vendors");
  return { ok: true as const, count: parsed.data.vendorIds.length };
}

export async function adminBulkDeleteVendors(input: unknown) {
  const parsed = bulkVendorIdsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();

  let deletedCount = 0;
  let suspendedCount = 0;

  for (const id of parsed.data.vendorIds) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    if (!vendor) continue;

    const [hasLedger] = await db
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.vendorId, vendor.id))
      .limit(1);

    if (hasLedger) {
      await db
        .update(vendors)
        .set({ status: "suspended", acceptingOrders: false, updatedAt: new Date() })
        .where(eq(vendors.id, vendor.id));
      suspendedCount++;
    } else {
      await db.delete(vendors).where(eq(vendors.id, vendor.id));
      if (vendor.loginUserId) {
        try {
          const existingUser = await hexclave.getUser(vendor.loginUserId);
          if (existingUser) await existingUser.delete();
        } catch {
          // ignore
        }
      }
      deletedCount++;
    }
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/vendors");
  return {
    ok: true as const,
    deletedCount,
    suspendedCount,
  };
}

export async function adminSaveCategory(input: unknown) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();
  const { id, vendorType, ...rest } = parsed.data;
  // Fulfilment always follows the vendor type; the type itself is fixed after creation.
  const values = { ...rest, fulfilment: VENDOR_TYPE_INFO[vendorType].fulfilment };
  await db.insert(categories).values({ id, vendorType, ...values }).onConflictDoUpdate({ target: categories.id, set: values });
  revalidatePath("/admin/settings");
  revalidatePath("/app", "layout");
  return { ok: true as const };
}

export async function adminSaveLocality(input: unknown) {
  const parsed = localitySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();
  const { id, ...rest } = parsed.data;
  await db.insert(localities).values({ id, ...rest }).onConflictDoUpdate({ target: localities.id, set: rest });
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function adminAddAdmin(input: unknown) {
  const parsed = adminEmailSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  await db.insert(platformAdmins).values({ email: parsed.data.email, createdBy: user.id }).onConflictDoNothing();
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function adminRemoveAdmin(input: unknown) {
  const parsed = adminIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const { user } = await requireAdmin();
  const db = getDb();

  const [row] = await db.select().from(platformAdmins).where(eq(platformAdmins.id, parsed.data.id)).limit(1);
  if (!row) return fail("Admin not found");
  const self = row.userId === user.id || (!!row.email && row.email === user.primaryEmail?.toLowerCase());
  if (self) return fail("You can't remove yourself");
  const others = await db.select({ id: platformAdmins.id }).from(platformAdmins).where(ne(platformAdmins.id, row.id));
  if (others.length === 0) return fail("Keep at least one admin");

  await db.delete(platformAdmins).where(eq(platformAdmins.id, row.id));
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

/** How far from a household stores are shown (the geofence). */
export async function adminSaveDiscoveryRadius(input: unknown) {
  const parsed = discoverySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const values = { discoveryRadiusKm: parsed.data.discoveryRadiusKm, updatedBy: user.id, updatedAt: new Date() };
  await db.insert(platformSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: platformSettings.id, set: values });
  revalidatePath("/admin/settings");
  revalidatePath("/app", "layout");
  return { ok: true as const };
}
