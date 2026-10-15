import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import crypto from "crypto";
import { eq, and, or } from "drizzle-orm";
import { hexclave } from "./hexclave";
import { getDb } from "@/db";
import { vendors, vendorMembers, customers, platformAdmins } from "@/db/schema";

export type Role = "owner" | "staff" | "driver";
const ALL_ROLES: Role[] = ["owner", "staff", "driver"];

export const requireUser = cache(async () => {
  const user = await hexclave.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
});

/**
 * Admins live in the platform_admins table, matched by Hexclave user id or by a
 * verified primary email. Cached per request.
 */
export const isUserAdmin = cache(
  async (user: { id: string; primaryEmail?: string | null; primaryEmailVerified?: boolean }): Promise<boolean> => {
    const db = getDb();
    const email = user.primaryEmailVerified ? user.primaryEmail?.toLowerCase() : undefined;
    const [row] = await db
      .select({ id: platformAdmins.id })
      .from(platformAdmins)
      .where(email ? or(eq(platformAdmins.userId, user.id), eq(platformAdmins.email, email)) : eq(platformAdmins.userId, user.id))
      .limit(1);
    return !!row;
  }
);

/** Staff-facing pages send signed-out people to the merchant sign-in, not the household one. */
export const requireStaffUser = cache(async (next: string) => {
  const user = await hexclave.getUser();
  if (!user) {
    redirect("/merchant-panel/sign-in?next=" + encodeURIComponent(next));
  }
  return user;
});

export const requireVendorAccess = cache(
  async (slug: string, allowedRoles: Role[] = ALL_ROLES) => {
    const user = await requireStaffUser("/merchant-panel/" + slug + "/today");
    const db = getDb();

    const [row] = await db
      .select({
        vendor: vendors,
        member: vendorMembers,
      })
      .from(vendors)
      .innerJoin(
        vendorMembers,
        and(
          eq(vendorMembers.vendorId, vendors.id),
          eq(vendorMembers.userId, user.id)
        )
      )
      .where(eq(vendors.slug, slug))
      .limit(1);

    if (row) {
      const { vendor, member } = row;
      if (vendor.status === "suspended") {
        notFound();
      }

      if (!allowedRoles.includes(member.role as Role)) {
        notFound();
      }

      return {
        user,
        vendor,
        vendorId: vendor.id,
        role: member.role as Role,
      };
    }

    if (await isUserAdmin(user)) {
      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.slug, slug))
        .limit(1);

      if (vendor && vendor.status !== "suspended") {
        return {
          user,
          vendor,
          vendorId: vendor.id,
          role: "owner" as Role,
        };
      }
    }

    notFound();
  }
);

export const requireAdmin = cache(async () => {
  const user = await requireStaffUser("/admin");
  if (!(await isUserAdmin(user))) {
    notFound();
  }

  return { user };
});

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export const requireCustomerByToken = cache(async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const db = getDb();

  const [row] = await db
    .select({
      customer: customers,
      vendor: vendors,
    })
    .from(customers)
    .innerJoin(vendors, eq(customers.vendorId, vendors.id))
    .where(eq(customers.linkTokenHash, tokenHash))
    .limit(1);

  if (!row) {
    notFound();
  }

  const { customer, vendor } = row;
  if (vendor.status === "suspended") {
    notFound();
  }

  return {
    customer,
    vendor,
    vendorId: vendor.id,
  };
});

export const findCustomerByToken = cache(async (rawToken: string) => {
  if (!rawToken || typeof rawToken !== "string" || !rawToken.trim()) {
    return null;
  }
  const tokenHash = hashToken(rawToken.trim());
  const db = getDb();

  const [row] = await db
    .select({
      customer: customers,
      vendor: vendors,
    })
    .from(customers)
    .innerJoin(vendors, eq(customers.vendorId, vendors.id))
    .where(eq(customers.linkTokenHash, tokenHash))
    .limit(1);

  if (!row || row.vendor.status === "suspended") {
    return null;
  }

  return {
    customer: row.customer,
    vendor: row.vendor,
    vendorId: row.vendor.id,
  };
});
