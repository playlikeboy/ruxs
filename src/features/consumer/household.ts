import "server-only";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, customers } from "@/db/schema";
import { hashToken } from "@/lib/auth/session";
import { readGpsCookie } from "@/lib/location";
import { haversineDistanceKm, resolveCoordinates } from "@/core/geo";
import { getLocalities } from "@/features/platform/queries";

export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Profile = typeof consumers.$inferSelect;

export function addressLine(p: Profile): string {
  return [p.flat, p.floor && `Floor ${p.floor}`, p.tower && `Tower ${p.tower}`, p.society, p.landmark, p.area, p.city]
    .filter(Boolean)
    .join(", ");
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const db = getDb();
  const [profile] = await db.select().from(consumers).where(eq(consumers.userId, userId)).limit(1);
  return profile ?? null;
}

/**
 * Finds or creates this household's customer row inside a vendor, so the
 * merchant's run sheet, bills and ledger work exactly as for imported customers.
 */
export async function ensureCustomer(tx: Tx, vendorId: string, profile: Profile): Promise<string> {
  const [mine] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.vendorId, vendorId), eq(customers.userId, profile.userId)))
    .limit(1);

  const addressFields = {
    name: profile.name,
    society: profile.society,
    tower: profile.tower || "-",
    floor: profile.floor || "-",
    flat: profile.flat,
    updatedAt: new Date(),
  };

  if (mine) {
    await tx.update(customers).set(addressFields).where(eq(customers.id, mine.id));
    return mine.id;
  }

  const [byPhone] = await tx
    .select({ id: customers.id, userId: customers.userId })
    .from(customers)
    .where(and(eq(customers.vendorId, vendorId), eq(customers.phone, profile.phone)))
    .limit(1);

  if (byPhone) {
    if (byPhone.userId && byPhone.userId !== profile.userId) {
      throw new Error("PHONE_LINKED_ELSEWHERE");
    }
    // The vendor imported this household earlier; link it to the app account.
    await tx
      .update(customers)
      .set({ ...addressFields, userId: profile.userId })
      .where(eq(customers.id, byPhone.id));
    return byPhone.id;
  }

  const [created] = await tx
    .insert(customers)
    .values({
      ...addressFields,
      vendorId,
      userId: profile.userId,
      phone: profile.phone,
      linkTokenHash: hashToken(crypto.randomBytes(32).toString("hex")),
    })
    .returning({ id: customers.id });
  return created!.id;
}

/**
 * Geofence check on the server: the delivery address must be inside the
 * store's own delivery radius. The household's search radius only filters lists.
 * Address pin first, then the last GPS fix, then the address's locality centre.
 */
export async function deliveryCheck(
  vendor: { latitude: number | null; longitude: number | null; city: string; area: string; serviceRadiusKm: number },
  profile: Profile
): Promise<string | null> {
  const [localities, gps] = await Promise.all([getLocalities(), readGpsCookie()]);
  const home =
    profile.latitude != null && profile.longitude != null
      ? { latitude: profile.latitude, longitude: profile.longitude }
      : (gps ?? resolveCoordinates(profile.city, profile.area, localities));
  if (!home) return "Set your location so we can check this store delivers to you";
  const shop =
    vendor.latitude != null && vendor.longitude != null
      ? { latitude: vendor.latitude, longitude: vendor.longitude }
      : resolveCoordinates(vendor.city, vendor.area, localities);
  const distance = shop ? haversineDistanceKm(home.latitude, home.longitude, shop.latitude, shop.longitude) : null;
  return distance != null && distance <= vendor.serviceRadiusKm ? null : "This store doesn't deliver to your address";
}

