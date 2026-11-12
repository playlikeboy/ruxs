"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { hashToken, requireVendorAccess } from "@/lib/auth/session";
import { importCustomersSchema, resetCustomerLinkSchema } from "./schemas";
import { APP_URL } from "@/lib/app-url";

function normalizeIndianPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-\(\)\.]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }
  return null;
}


export interface ImportResultRow {
  name: string;
  phone: string;
  society: string;
  tower: string;
  floor: string;
  flat: string;
  rawLink?: string;
  error?: string;
}

const MAX_IMPORT_LINES = 500;

export async function importCustomers(input: unknown) {
  const parsed = importCustomersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, rawText } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length > MAX_IMPORT_LINES) {
    return { ok: false, error: `Import up to ${MAX_IMPORT_LINES} customers at a time` };
  }
  const results: ImportResultRow[] = [];

  // One read for the duplicate check instead of one query per line.
  const known = await db
    .select({ phone: customers.phone })
    .from(customers)
    .where(eq(customers.vendorId, access.vendorId));
  const takenPhones = new Set(known.map((c) => c.phone));

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]!.trim();
    // Support CSV comma or tab delimited lines
    const parts = line.split(/[,\t]/).map((p) => p.trim());

    // Skip header line if detected
    if (idx === 0 && parts[0]?.toLowerCase().includes("name") && parts[1]?.toLowerCase().includes("phone")) {
      continue;
    }

    if (parts.length < 6) {
      results.push({
        name: parts[0] || "Unknown",
        phone: parts[1] || "",
        society: parts[2] || "",
        tower: parts[3] || "",
        floor: parts[4] || "",
        flat: parts[5] || "",
        error: "Missing required fields (expected name, phone, society, tower, floor, flat)",
      });
      continue;
    }

    const [name, rawPhone, society, tower, floor, flat] = parts;
    const phone = normalizeIndianPhone(rawPhone!);

    if (!name || name.length < 1) {
      results.push({ name: "", phone: rawPhone!, society: society!, tower: tower!, floor: floor!, flat: flat!, error: "Name is empty" });
      continue;
    }

    if (name.length > 80 || society!.length > 120 || tower!.length > 40 || floor!.length > 20 || flat!.length > 40) {
      results.push({ name, phone: rawPhone!, society: society!, tower: tower!, floor: floor!, flat: flat!, error: "A field is too long" });
      continue;
    }

    if (!phone) {
      results.push({
        name: name!,
        phone: rawPhone!,
        society: society!,
        tower: tower!,
        floor: floor!,
        flat: flat!,
        error: "Invalid 10-digit Indian phone number",
      });
      continue;
    }

    if (takenPhones.has(phone)) {
      results.push({
        name: name!,
        phone,
        society: society!,
        tower: tower!,
        floor: floor!,
        flat: flat!,
        error: "Phone number already exists for this vendor",
      });
      continue;
    }

    // Generate 32-byte secure random link token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const linkTokenHash = hashToken(rawToken);

    try {
      await db.insert(customers).values({
        vendorId: access.vendorId,
        name: name!,
        phone,
        society: society!,
        tower: tower!,
        floor: floor!,
        flat: flat!,
        linkTokenHash,
      });
      takenPhones.add(phone);

      results.push({
        name: name!,
        phone,
        society: society!,
        tower: tower!,
        floor: floor!,
        flat: flat!,
        rawLink: `${APP_URL}/c/${rawToken}`,
      });
    } catch (err: unknown) {
      // Database errors stay in the server log; the merchant sees a plain reason.
      console.error("importCustomers insert failed:", err);
      results.push({ name: name!, phone, society: society!, tower: tower!, floor: floor!, flat: flat!, error: "Could not add this customer" });
    }
  }

  revalidatePath(`/merchant-panel/${slug}/customers`);
  const successCount = results.filter((r) => !r.error).length;
  return { ok: true, results, successCount };
}

export async function resetCustomerLink(input: unknown) {
  const parsed = resetCustomerLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, customerId } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  const rawToken = crypto.randomBytes(32).toString("hex");
  const linkTokenHash = hashToken(rawToken);

  try {
    const [updated] = await db
      .update(customers)
      .set({ linkTokenHash, updatedAt: new Date() })
      .where(and(eq(customers.id, customerId), eq(customers.vendorId, access.vendorId)))
      .returning();

    if (!updated) {
      return { ok: false, error: "Customer not found" };
    }

    revalidatePath(`/merchant-panel/${slug}/customers/${customerId}`);
    return { ok: true, rawLink: `${APP_URL}/c/${rawToken}` };
  } catch (err: unknown) {
    console.error("resetCustomerLink failed:", err);
    return { ok: false, error: "Could not reset the link. Please try again." };
  }
}
