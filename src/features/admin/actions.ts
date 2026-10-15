"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorInvites, vendorMembers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { hexclave } from "@/lib/auth/hexclave";
import {
  createVendorForAdminSchema,
  vendorStatusActionSchema,
  setVendorCredentialsSchema,
  adminUpdateVendorSchema,
} from "./schemas";
import { rupeesToPaise } from "@/core/money";

function generateSecurePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
  let pwd = "Ruxs!";
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function createVendorForAdmin(input: unknown) {
  const parsed = createVendorForAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = await requireAdmin();
  const db = getDb();
  const data = parsed.data;
  const ownerEmail = data.ownerEmail.toLowerCase().trim();
  const rawPassword = data.password?.trim() || generateSecurePassword();

  let hexUserId: string;
  try {
    const hexUser = await hexclave.createUser({
      primaryEmail: ownerEmail,
      password: rawPassword,
      primaryEmailVerified: true,
      displayName: data.name,
    });
    hexUserId = hexUser.id;
  } catch (err: unknown) {
    try {
      const existingUsers = await hexclave.listUsers();
      const found = existingUsers.find(
        (u) => u.primaryEmail?.toLowerCase() === ownerEmail
      );
      if (found) {
        hexUserId = found.id;
        if (found.setPassword) {
          try {
            await found.setPassword({ password: rawPassword });
          } catch {}
        }
      } else {
        return {
          ok: false as const,
          error:
            "Authentication service error: " +
            (err instanceof Error ? err.message : String(err)),
        };
      }
    } catch {
      return {
        ok: false as const,
        error: "Failed to provision user credentials with authentication provider.",
      };
    }
  }

  try {
    const created = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.slug, data.slug))
        .limit(1);

      if (existing) {
        throw new Error("SLUG_ALREADY_USED");
      }

      const [vendor] = await tx
        .insert(vendors)
        .values({
          name: data.name,
          slug: data.slug,
          phone: data.phone,
          upiVpa: data.upiVpa,
          city: data.city,
          area: data.area,
          plan: "free",
          status: "active",
        })
        .returning({
          id: vendors.id,
          slug: vendors.slug,
          name: vendors.name,
        });

      if (!vendor) {
        throw new Error("VENDOR_CREATION_FAILED");
      }

      await tx
        .insert(vendorMembers)
        .values({
          vendorId: vendor.id,
          userId: hexUserId,
          role: "owner",
        })
        .onConflictDoNothing();

      await tx.insert(vendorInvites).values({
        vendorId: vendor.id,
        email: ownerEmail,
        role: "owner",
        createdBy: admin.user.id,
        acceptedAt: new Date(),
        acceptedUserId: hexUserId,
      });

      return vendor;
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/merchant-panel");

    const portalUrl = `https://ruxs.in/merchant-panel/${created.slug}/today`;
    const loginUrl = "https://ruxs.in/merchant-panel/sign-in";

    const inviteText =
      "🔐 RUXS Merchant Portal Login Credentials\n\n" +
      "Business: " + created.name + "\n" +
      "Login Portal: " + loginUrl + "\n" +
      "Login ID / Email: " + ownerEmail + "\n" +
      "Password: " + rawPassword + "\n\n" +
      "Merchant Dashboard: " + portalUrl + "\n\n" +
      "You can log in now to manage daily orders, run sheets, customer deliveries, inventory (cans/dabbas), monthly bills, and business analytics.";

    return {
      ok: true as const,
      slug: created.slug,
      name: created.name,
      ownerEmail,
      password: rawPassword,
      portalUrl,
      loginUrl,
      inviteText,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "SLUG_ALREADY_USED") {
      return { ok: false as const, error: "That portal slug is already in use. Choose another one." };
    }
    return {
      ok: false as const,
      error: "Could not create the vendor. Check the details and try again.",
    };
  }
}

export async function setVendorCredentialsForAdmin(input: unknown) {
  const parsed = setVendorCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = await requireAdmin();
  const db = getDb();
  const data = parsed.data;
  const ownerEmail = data.ownerEmail.toLowerCase().trim();
  const rawPassword = data.password?.trim() || generateSecurePassword();

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, data.vendorId))
    .limit(1);

  if (!vendor) {
    return { ok: false as const, error: "Vendor not found" };
  }

  let hexUserId: string;
  try {
    const hexUser = await hexclave.createUser({
      primaryEmail: ownerEmail,
      password: rawPassword,
      primaryEmailVerified: true,
      displayName: vendor.name,
    });
    hexUserId = hexUser.id;
  } catch (err: unknown) {
    try {
      const existingUsers = await hexclave.listUsers();
      const found = existingUsers.find(
        (u) => u.primaryEmail?.toLowerCase() === ownerEmail
      );
      if (found) {
        hexUserId = found.id;
        if (found.setPassword) {
          try {
            await found.setPassword({ password: rawPassword });
          } catch {}
        }
      } else {
        return {
          ok: false as const,
          error:
            "Authentication service error: " +
            (err instanceof Error ? err.message : String(err)),
        };
      }
    } catch {
      return {
        ok: false as const,
        error: "Failed to set user account with authentication provider.",
      };
    }
  }

  await db
    .insert(vendorMembers)
    .values({
      vendorId: vendor.id,
      userId: hexUserId,
      role: "owner",
    })
    .onConflictDoNothing();

  await db
    .insert(vendorInvites)
    .values({
      vendorId: vendor.id,
      email: ownerEmail,
      role: "owner",
      createdBy: admin.user.id,
      acceptedAt: new Date(),
      acceptedUserId: hexUserId,
    });

  revalidatePath("/admin", "layout");
  revalidatePath("/merchant-panel");

  const portalUrl = `https://ruxs.in/merchant-panel/${vendor.slug}/today`;
  const loginUrl = "https://ruxs.in/merchant-panel/sign-in";

  const inviteText =
    "🔐 RUXS Merchant Portal Login Credentials\n\n" +
    "Business: " + vendor.name + "\n" +
    "Login Portal: " + loginUrl + "\n" +
    "Login ID / Email: " + ownerEmail + "\n" +
    "Password: " + rawPassword + "\n\n" +
    "Merchant Dashboard: " + portalUrl + "\n\n" +
    "You can log in now to manage daily orders, run sheets, customer deliveries, inventory (cans/dabbas), monthly bills, and business analytics.";

  return {
    ok: true as const,
    slug: vendor.slug,
    name: vendor.name,
    ownerEmail,
    password: rawPassword,
    portalUrl,
    loginUrl,
    inviteText,
  };
}

export async function approveVendor(input: unknown) {
  const parsed = vendorStatusActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
      return { ok: false as const, error: "Vendor not found" };
    }

    revalidatePath("/admin", "layout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to approve vendor" };
  }
}

export async function suspendVendor(input: unknown) {
  const parsed = vendorStatusActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
      return { ok: false as const, error: "Vendor not found" };
    }

    revalidatePath("/admin", "layout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to suspend vendor" };
  }
}

export async function adminUpdateVendor(input: unknown) {
  const parsed = adminUpdateVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await requireAdmin();
  const { vendorId, deliveryFeeRupees, ...data } = parsed.data;
  const db = getDb();
  const [updated] = await db
    .update(vendors)
    .set({ ...data, deliveryFeePaise: rupeesToPaise(deliveryFeeRupees), updatedAt: new Date() })
    .where(eq(vendors.id, vendorId))
    .returning({ slug: vendors.slug });
  if (!updated) return { ok: false as const, error: "Vendor not found" };

  revalidatePath("/admin", "layout");
  revalidatePath(`/app/store/${updated.slug}`);
  return { ok: true as const };
}
