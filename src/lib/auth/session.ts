import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { hexclave } from "./hexclave";
import { getDb } from "@/db";
import { vendors, vendorMembers, customers } from "@/db/schema";

export type Role = "owner" | "staff" | "driver";
const ALL_ROLES: Role[] = ["owner", "staff", "driver"];

export const requireUser = cache(async () => {
  const user = await hexclave.getUser({ or: "redirect" });
  return user;
});

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

    if (!row) {
      notFound();
    }

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
);

export const requireAdmin = cache(async () => {
  const user = await requireUser();
  const rawAdminIds = process.env.ADMIN_USER_IDS || "";
  const adminIds = rawAdminIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!adminIds.includes(user.id)) {
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
