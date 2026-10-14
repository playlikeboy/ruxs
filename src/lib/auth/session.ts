import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { hexclave } from "./hexclave";
import { getDb } from "@/db";
import { vendors, vendorMembers, customers } from "@/db/schema";
import { getServerEnv } from "@/lib/env";

export type Role = "owner" | "staff" | "driver";
const ALL_ROLES: Role[] = ["owner", "staff", "driver"];

export const requireUser = cache(async () => {
  const user = await hexclave.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
});

export function isUserAdmin(user: { id: string; primaryEmail?: string | null }): boolean {
  const env = getServerEnv();
  const adminIds = (env.ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const adminEmails = (env.ADMIN_EMAILS || "sh20raj@gmail.com,shaswatraj3@gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = user.primaryEmail?.toLowerCase() || "";
  return adminIds.includes(user.id) || adminEmails.includes(userEmail);
}

export const requireVendorAccess = cache(
  async (slug: string, allowedRoles: Role[] = ALL_ROLES) => {
    const user = await requireUser();
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

    if (isUserAdmin(user)) {
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
  const user = await requireUser();
  if (!isUserAdmin(user)) {
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
