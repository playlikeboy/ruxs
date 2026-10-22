"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, services } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { hexclave } from "@/lib/auth/hexclave";
import { VENDOR_TYPE_INFO, toVendorType } from "@/core/vendor-types";
import { ITEM_FIELDS, PROFILE_FIELDS } from "./fields";
import { saveItemDetailsSchema, saveTypeProfileSchema, valuesSchema } from "./schemas";
import { writeItemDetails, writeTypeProfile } from "./tables";
import { z } from "zod";

function fail(error: string) {
  return { ok: false as const, error };
}

/** Saves the owner's type-specific profile (kitchen, clinic, studio…). */
export async function saveTypeProfile(input: unknown) {
  const parsed = saveTypeProfileSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const access = await requireVendorAccess(parsed.data.slug, ["owner"]);
  const type = toVendorType(access.vendor.vendorType, access.vendor.businessType);
  const values = valuesSchema(PROFILE_FIELDS[type]).safeParse(parsed.data.values);
  if (!values.success) return fail(values.error.issues[0]?.message ?? "Check the highlighted fields");

  await writeTypeProfile(getDb(), access.vendorId, type, values.data);
  revalidatePath(`/merchant-panel/${parsed.data.slug}`, "layout");
  revalidatePath(`/app/store/${parsed.data.slug}`);
  return { ok: true as const };
}

/** Saves one item's type-specific details. The item must belong to this vendor. */
export async function saveItemDetails(input: unknown) {
  const parsed = saveItemDetailsSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const access = await requireVendorAccess(parsed.data.slug, ["owner"]);
  const type = toVendorType(access.vendor.vendorType, access.vendor.businessType);
  const fields = ITEM_FIELDS[type];
  if (!fields) return fail(`${VENDOR_TYPE_INFO[type].label}s have no extra item details`);
  const values = valuesSchema(fields).safeParse(parsed.data.values);
  if (!values.success) return fail(values.error.issues[0]?.message ?? "Check the highlighted fields");

  const db = getDb();
  const table = VENDOR_TYPE_INFO[type].fulfilment === "booking" ? services : products;
  const [own] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, parsed.data.itemId), eq(table.vendorId, access.vendorId)))
    .limit(1);
  if (!own) return fail("Item not found");

  await writeItemDetails(db, access.vendorId, type, parsed.data.itemId, values.data);
  revalidatePath(`/merchant-panel/${parsed.data.slug}/${table === services ? "services" : "products"}`);
  revalidatePath(`/app/store/${parsed.data.slug}`);
  return { ok: true as const };
}

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(10, "Use at least 10 characters").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: "The new passwords don't match", path: ["confirm"] })
  .refine((d) => d.newPassword !== d.oldPassword, { message: "Pick a password you haven't used here", path: ["newPassword"] });

/** Any signed-in merchant (owner, staff, driver) changes their own password. */
export async function changeMyPassword(input: unknown) {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const user = await hexclave.getUser();
  if (!user) return fail("Sign in again to change your password");
  try {
    const error = await user.updatePassword({ oldPassword: parsed.data.oldPassword, newPassword: parsed.data.newPassword });
    if (error) {
      return fail(error.errorCode === "PASSWORD_CONFIRMATION_MISMATCH" ? "Your current password is wrong" : "That password is too weak. Use 10+ characters with letters and numbers.");
    }
  } catch {
    return fail("Couldn't change the password right now. Try again.");
  }
  return { ok: true as const };
}
