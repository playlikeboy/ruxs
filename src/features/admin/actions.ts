"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorMembers, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { hexclave } from "@/lib/auth/hexclave";
import { vendorStatusActionSchema, createVendorAccountSchema } from "./schemas";


export async function approveVendor(input: unknown) {
  const parsed = vendorStatusActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireAdmin();
  const db = getDb();

  try {
    const [updated] = await db
      .update(vendors)
      .set({ status: "active" })
      .where(eq(vendors.id, parsed.data.vendorId))
      .returning();

    if (!updated) {
      return { ok: false, error: "Vendor not found" };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve vendor";
    return { ok: false, error: msg };
  }
}

export async function suspendVendor(input: unknown) {
  const parsed = vendorStatusActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireAdmin();
  const db = getDb();

  try {
    const [updated] = await db
      .update(vendors)
      .set({ status: "suspended" })
      .where(eq(vendors.id, parsed.data.vendorId))
      .returning();

    if (!updated) {
      return { ok: false, error: "Vendor not found" };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to suspend vendor";
    return { ok: false, error: msg };
  }
}

export async function createVendorWithAccount(input: unknown) {
  const parsed = createVendorAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  await requireAdmin();
  const db = getDb();
  const data = parsed.data;

  // 1. Check if slug is already taken
  const [existingSlug] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.slug, data.slug))
    .limit(1);

  if (existingSlug) {
    return {
      ok: false as const,
      error: "A vendor with this slug already exists. Please choose a different slug.",
    };
  }

  // 2. Create the user in Hexclave
  let hexUser;
  try {
    hexUser = await hexclave.createUser({
      primaryEmail: data.email.toLowerCase(),
      password: data.password,
      displayName: data.name,
      primaryEmailVerified: true,
      primaryEmailAuthEnabled: true,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to create vendor login user in Hexclave";
    return { ok: false as const, error: msg };
  }

  // 3. Insert vendor into database
  try {
    const [vendor] = await db
      .insert(vendors)
      .values({
        name: data.name,
        slug: data.slug,
        phone: data.phone,
        area: data.area,
        city: data.city,
        status: "active",
        plan: "free",
        upiVpa: data.upiId || `${data.phone}@upi`,
      })
      .returning();

    if (!vendor) {
      return { ok: false as const, error: "Failed to create vendor record" };
    }

    // 4. Link user as owner
    await db.insert(vendorMembers).values({
      vendorId: vendor.id,
      userId: hexUser.id,
      role: "owner",
    });

    // 5. Seed default starter product
    if (data.businessType === "tiffin") {
      await db.insert(products).values({
        vendorId: vendor.id,
        kind: "tiffin",
        name: "Standard Veg Lunch Box",
        shift: "lunch",
        pricePaise: 12000, // ₹120.00
        cutoffAt: "10:00",
        lateRule: "full",
        assetName: "dabba",
      });
    } else {
      await db.insert(products).values({
        vendorId: vendor.id,
        kind: "water",
        name: "20L Mineral Water Can",
        shift: "morning",
        pricePaise: 8000, // ₹80.00
        cutoffAt: "08:00",
        lateRule: "full",
        assetName: "can",
      });
    }

    revalidatePath("/admin");

    return {
      ok: true as const,
      data: {
        vendorId: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        email: data.email,
        password: data.password,
        portalUrl: `/app/${vendor.slug}/today`,
      },
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to save vendor to database";
    return { ok: false as const, error: msg };
  }
}

