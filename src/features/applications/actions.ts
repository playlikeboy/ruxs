"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, platformAdmins, vendorApplications } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { renderEmailHtml, sendEmail } from "@/features/notifications/service";
import { applicationSchema, applicationUpdateSchema } from "./schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in";

function fail(error: string) {
  return { ok: false as const, error };
}

/**
 * Public: a business asks to join. No account needed; admin calls them back.
 * Guarded by a honeypot, a per-phone limit and a global hourly ceiling.
 */
export async function submitVendorApplication(input: unknown) {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form and try again.");
  const data = parsed.data;
  const db = getDb();
  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const hourAgo = new Date(Date.now() - 3600_000);

  const [[byPhone], [recent], [category]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(vendorApplications).where(and(eq(vendorApplications.phone, data.phone), gt(vendorApplications.createdAt, dayAgo))),
    db.select({ n: sql<number>`count(*)::int` }).from(vendorApplications).where(gt(vendorApplications.createdAt, hourAgo)),
    db.select({ label: categories.label }).from(categories).where(and(eq(categories.id, data.categoryId), eq(categories.isActive, true))).limit(1),
  ]);
  if ((byPhone?.n ?? 0) >= 2) return { ok: true as const, duplicate: true };
  if ((recent?.n ?? 0) >= 60) return fail("We're getting a lot of applications right now. Please try again in an hour.");
  if (!category) return fail("Pick what you offer.");

  await db.insert(vendorApplications).values({
    businessName: data.businessName,
    ownerName: data.ownerName,
    phone: data.phone,
    email: data.email || null,
    categoryId: data.categoryId,
    area: data.area,
    city: data.city,
    details: data.details || null,
  });

  after(() => emailAdmins(data.businessName, category.label, data.area, data.city).catch(() => {}));
  revalidatePath("/admin/applications");
  return { ok: true as const, duplicate: false };
}

async function emailAdmins(business: string, category: string, area: string, city: string) {
  const admins = await getDb().select({ email: platformAdmins.email }).from(platformAdmins).where(isNotNull(platformAdmins.email));
  const html = renderEmailHtml({
    heading: "New merchant application",
    lead: `${business} wants to join RUXs. Call them to verify, then approve to create their login.`,
    details: [{ label: "Offers", value: category }, { label: "Area", value: `${area}, ${city}` }],
    actionText: "Open applications",
    actionUrl: `${APP_URL}/admin/applications`,
  });
  await Promise.all(
    admins.map((a) => sendEmail({ to: a.email!, fromType: "alerts", subject: `New application: ${business}`, html, text: `${business} (${category}, ${area}) applied. ${APP_URL}/admin/applications` }))
  );
}

/** Admin: track the call (contacted / rejected) and keep notes. */
export async function adminUpdateApplication(input: unknown) {
  const parsed = applicationUpdateSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid update");
  await requireAdmin();
  const { id, ...set } = parsed.data;
  await getDb().update(vendorApplications).set({ ...set, updatedAt: new Date() }).where(eq(vendorApplications.id, id));
  revalidatePath("/admin/applications");
  return { ok: true as const };
}
