"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorInvites } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import {
  createVendorForAdminSchema,
  vendorStatusActionSchema,
} from "./schemas";

export async function createVendorForAdmin(input: unknown) {
  const parsed = createVendorForAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = await requireAdmin();
  const db = getDb();
  const data = parsed.data;
  const ownerEmail = data.ownerEmail.toLowerCase().trim();

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

      await tx.insert(vendorInvites).values({
        vendorId: vendor.id,
        email: ownerEmail,
        role: "owner",
        createdBy: admin.user.id,
      });

      return vendor;
    });

    revalidatePath("/admin");
    revalidatePath("/app");

    const inviteText =
      "Your RUXS merchant portal is ready.\\n\\n" +
      "Business: " + created.name + "\\n" +
      "Login ID: " + ownerEmail + "\\n\\n" +
      "Sign in or sign up at https://ruxs.in/app using this exact email address. Complete email verification. RUXS will link your account to the business automatically when you first open the portal.\\n\\n" +
      "Merchant dashboard: https://ruxs.in/app/" + created.slug + "/today\\n\\n" +
      "For security, create and manage your own password through the hosted sign-in flow. Do not send passwords in chat.";

    return {
      ok: true as const,
      slug: created.slug,
      ownerEmail,
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

    revalidatePath("/admin");
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

    revalidatePath("/admin");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to suspend vendor" };
  }
}
