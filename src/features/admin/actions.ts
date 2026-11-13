"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityRules, bookings, categories, kidsProviderProfiles, ledgerEntries, localities, payments, platformAdmins, platformSettings, shopOrders, vendorApplications, vendorMembers, vendorPayouts, vendors } from "@/db/schema";
import { VENDOR_TYPE_INFO, canUseModule, isVendorType, vendorTypeForCategory } from "@/core/vendor-types";
import { provisionTypeProfile } from "@/features/vendor-types/tables";
import { seedStarterCatalog } from "@/features/vendor-types/starter";
import { requireAdmin } from "@/lib/auth/session";
import { hexclave } from "@/lib/auth/hexclave";
import { renameMerchantAccount, syncMerchantAccount } from "@/features/admin/merchant-accounts";
import { rupeesToPaise } from "@/core/money";
import { DEFAULT_CATEGORIES } from "@/features/platform/queries";
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
import { APP_URL } from "@/lib/app-url";

const DEFAULT_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

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
  let userId: string;
  try {
    const synced = await syncMerchantAccount(vendor, loginId, password);
    if (!synced.ok) return fail(synced.error);
    userId = synced.userId;
  } catch (err) {
    return fail("Login service error: " + (err instanceof Error ? err.message : String(err)));
  }

  await db.update(vendors).set({ loginId, loginUserId: userId, updatedAt: new Date() }).where(eq(vendors.id, vendor.id));
  await db.insert(vendorMembers).values({ vendorId: vendor.id, userId, role: "owner" }).onConflictDoNothing();

  return {
    ok: true,
    credentials: { loginId, password, loginUrl: `${APP_URL}/merchant-panel/sign-in` },
  };
}

export async function adminCreateVendor(input: unknown) {
  const parsed = createVendorSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const [taken] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.slug, parsed.data.slug)).limit(1);
  if (taken) return fail("That store URL is already used. Pick another.");

  // The category decides the vendor type, which decides its tables and tools.
  let [category] = await db
    .select({ fulfilment: categories.fulfilment, vendorType: categories.vendorType })
    .from(categories)
    .where(eq(categories.id, parsed.data.categoryId))
    .limit(1);

  // Platform categories ship as code defaults; create the row vendors.category_id points at.
  const defaultCat = category ? undefined : DEFAULT_CATEGORIES.find((c) => c.id === parsed.data.categoryId);
  if (defaultCat) category = { fulfilment: defaultCat.fulfilment, vendorType: defaultCat.vendorType };
  if (!category) return fail("That business type no longer exists. Pick another.");

  const vendorType = isVendorType(category.vendorType) ? category.vendorType : vendorTypeForCategory(parsed.data.categoryId);
  const businessType = VENDOR_TYPE_INFO[vendorType].fulfilment;

  let vendor: { id: string } | undefined;
  try {
    vendor = await db.transaction(async (tx) => {
      if (defaultCat) {
        const { createdAt: _createdAt, ...values } = defaultCat;
        await tx.insert(categories).values(values).onConflictDoNothing();
      }
      const [row] = await tx
        .insert(vendors)
        .values({ ...detailsToColumns(parsed.data), slug: parsed.data.slug, businessType, vendorType, categoryId: parsed.data.categoryId, plan: "free", status: "active" })
        .returning({ id: vendors.id });
      await provisionTypeProfile(tx, row!.id, vendorType);
      // A conventional first menu, so the store is live and listed straight away. The owner edits or archives it.
      await seedStarterCatalog(tx, { id: row!.id, vendorType, categoryId: parsed.data.categoryId });
      // Bookable from day one: Mon–Sat 10:00–19:00. The owner adjusts it under Hours.
      if (businessType === "booking") {
        await tx.insert(availabilityRules).values(DEFAULT_WEEK.map((weekday) => ({ vendorId: row!.id, weekday, startTime: "10:00", endTime: "19:00" })));
      }
      // An admin onboards a kids provider only after vetting them, so it starts approved, matching "Active & live".
      if (canUseModule(vendorType, "kids")) {
        await tx
          .insert(kidsProviderProfiles)
          .values({ vendorId: row!.id, verificationStatus: "approved", safetyReviewStatus: "passed", verifiedByAdminId: admin.id, verifiedAt: new Date() })
          .onConflictDoNothing();
      }
      if (parsed.data.applicationId) {
        // Lock the application so two admins approving it at once cannot each create a store.
        const [app] = await tx
          .select({ status: vendorApplications.status, vendorId: vendorApplications.vendorId })
          .from(vendorApplications)
          .where(eq(vendorApplications.id, parsed.data.applicationId))
          .limit(1)
          .for("update");
        if (app?.status === "approved" && app.vendorId) throw new Error("this application is already approved and has a store");
        await tx
          .update(vendorApplications)
          .set({ status: "approved", vendorId: row!.id, updatedAt: new Date() })
          .where(eq(vendorApplications.id, parsed.data.applicationId));
      }
      return row;
    });
  } catch (err) {
    // Surface the database reason to the admin instead of the crash page.
    console.error("adminCreateVendor failed", err);
    const cause = err instanceof Error ? ((err.cause as Error | undefined)?.message ?? err.message) : String(err);
    return fail(`Could not create the ${VENDOR_TYPE_INFO[vendorType].label.toLowerCase()}: ${cause.slice(0, 200)}`);
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
  const [vendor] = await db.select({ id: vendors.id, slug: vendors.slug, name: vendors.name, loginUserId: vendors.loginUserId }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor?.loginUserId) return fail("Generate a login first.");
  const [taken] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.loginId, loginId)).limit(1);
  if (taken && taken.id !== vendor.id) return fail("That login ID is already used by another store.");
  try {
    const renamed = await renameMerchantAccount({ ...vendor, loginUserId: vendor.loginUserId }, loginId);
    if (!renamed.ok) return fail(renamed.error);
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

type Db = ReturnType<typeof getDb>;

async function deleteLoginAccount(userId: string | null) {
  if (!userId) return;
  try {
    const existingUser = await hexclave.getUser(userId);
    if (existingUser) await existingUser.delete();
  } catch (err) {
    // The store row is already gone; an orphaned login is adopted on the next issue, so log and move on.
    console.error("Could not delete merchant login", userId, err);
  }
}

/**
 * Vendors among `ids` that have money or order history. Their rows cascade from vendors, so a hard delete
 * would silently erase collected payments, refunds due, payouts, app orders and bookings.
 */
async function vendorsWithHistory(db: Db, ids: string[]) {
  const [ledger, paid, payouts, orders, booked] = await Promise.all([
    db.selectDistinct({ vendorId: ledgerEntries.vendorId }).from(ledgerEntries).where(inArray(ledgerEntries.vendorId, ids)),
    db.selectDistinct({ vendorId: payments.vendorId }).from(payments).where(inArray(payments.vendorId, ids)),
    db.selectDistinct({ vendorId: vendorPayouts.vendorId }).from(vendorPayouts).where(inArray(vendorPayouts.vendorId, ids)),
    db.selectDistinct({ vendorId: shopOrders.vendorId }).from(shopOrders).where(inArray(shopOrders.vendorId, ids)),
    db.selectDistinct({ vendorId: bookings.vendorId }).from(bookings).where(inArray(bookings.vendorId, ids)),
  ]);
  const withLedger = new Set(ledger.map((r) => r.vendorId));
  const withHistory = new Set([...ledger, ...paid, ...payouts, ...orders, ...booked].map((r) => r.vendorId));
  return { withLedger, withHistory };
}

/**
 * Permanently deletes a vendor with no money or order history (FK cascades remove its catalog, profiles and members).
 * A vendor with history, or one the database refuses to delete, is suspended and paused instead,
 * because ledger rows are immutable (0001_ledger_immutability.sql) and payments, orders and bookings must be kept.
 */
async function deleteOrSuspendVendor(db: Db, vendor: { id: string; loginUserId: string | null }, hasHistory: boolean): Promise<"deleted" | "suspended"> {
  if (!hasHistory) {
    try {
      await db.delete(vendors).where(eq(vendors.id, vendor.id));
      await deleteLoginAccount(vendor.loginUserId);
      return "deleted";
    } catch (err) {
      console.error("Vendor delete refused, suspending instead", vendor.id, err);
    }
  }
  await db.update(vendors).set({ status: "suspended", acceptingOrders: false, updatedAt: new Date() }).where(eq(vendors.id, vendor.id));
  return "suspended";
}

export async function adminDeleteVendor(input: unknown) {
  const parsed = vendorIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid vendor ID");
  await requireAdmin();
  const db = getDb();

  const [[vendor], history] = await Promise.all([
    db.select({ id: vendors.id, name: vendors.name, loginUserId: vendors.loginUserId }).from(vendors).where(eq(vendors.id, parsed.data.vendorId)).limit(1),
    vendorsWithHistory(db, [parsed.data.vendorId]),
  ]);
  if (!vendor) return fail("Vendor not found");
  const hasLedger = history.withLedger.has(vendor.id);

  const outcome = await deleteOrSuspendVendor(db, vendor, history.withHistory.has(vendor.id));
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/vendors");

  if (outcome === "suspended") {
    return {
      ok: false as const,
      protectedByLedger: true,
      error: hasLedger
        ? `Store "${vendor.name}" has permanent financial ledger records and cannot be permanently deleted. The store has been deactivated and suspended instead.`
        : `Store "${vendor.name}" has records that must be kept, so it cannot be permanently deleted. The store has been deactivated and suspended instead.`,
    };
  }
  return { ok: true as const, message: `Store "${vendor.name}" was permanently deleted.` };
}

export async function adminBulkSetVendorStatus(input: unknown) {
  const parsed = bulkVendorStatusSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();

  const updated = await db
    .update(vendors)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(inArray(vendors.id, parsed.data.vendorIds))
    .returning({ id: vendors.id });

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/vendors");
  return { ok: true as const, count: updated.length };
}

export async function adminBulkDeleteVendors(input: unknown) {
  const parsed = bulkVendorIdsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await requireAdmin();
  const db = getDb();
  const ids = Array.from(new Set(parsed.data.vendorIds));

  // A fixed number of queries for the whole selection instead of several per vendor.
  const [rows, { withHistory }] = await Promise.all([
    db.select({ id: vendors.id, loginUserId: vendors.loginUserId }).from(vendors).where(inArray(vendors.id, ids)),
    vendorsWithHistory(db, ids),
  ]);

  let deletedCount = 0;
  let suspendedCount = 0;
  for (const vendor of rows) {
    const outcome = await deleteOrSuspendVendor(db, vendor, withHistory.has(vendor.id));
    if (outcome === "deleted") deletedCount++;
    else suspendedCount++;
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
  // Fulfilment always follows the vendor type; the type itself is fixed after creation,
  // so an existing category keeps the fulfilment of its stored type whatever the form sent.
  const [existing] = await db.select({ vendorType: categories.vendorType }).from(categories).where(eq(categories.id, id)).limit(1);
  const fixedType = existing && isVendorType(existing.vendorType) ? existing.vendorType : vendorType;
  const values = { ...rest, fulfilment: VENDOR_TYPE_INFO[fixedType].fulfilment };
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

  // Lock every admin row (in a fixed order) so two admins removing each other at the same
  // moment run one after the other; the second then sees a single row left and is refused.
  const error = await db.transaction(async (tx) => {
    const all = await tx.select().from(platformAdmins).orderBy(asc(platformAdmins.id)).for("update");
    const row = all.find((a) => a.id === parsed.data.id);
    if (!row) return "Admin not found";
    const self = row.userId === user.id || (!!row.email && row.email === user.primaryEmail?.toLowerCase());
    if (self) return "You can't remove yourself";
    // The caller passed requireAdmin before the lock; make sure nobody removed them while this waited.
    const callerEmail = user.primaryEmailVerified ? user.primaryEmail?.toLowerCase() : undefined;
    const callerStillAdmin = all.some((a) => a.userId === user.id || (!!callerEmail && a.email === callerEmail));
    if (!callerStillAdmin) return "You no longer have admin access";
    if (all.length <= 1) return "Keep at least one admin";
    await tx.delete(platformAdmins).where(eq(platformAdmins.id, row.id));
    return null;
  });
  if (error) return fail(error);
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
