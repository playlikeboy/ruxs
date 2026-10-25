import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors } from "@/db/schema";
import { exactEmailMatch, merchantLoginEmail } from "@/core/merchant-login";
import { hexclave } from "@/lib/auth/hexclave";

/**
 * Hexclave is the only place merchant logins live; RUXs keeps vendors.login_user_id
 * as the link. These helpers keep the two in step: an account left behind by a
 * deleted vendor or a data reset is adopted, never duplicated.
 */

type Vendor = { id: string; slug: string; name: string; loginUserId: string | null };

function metadata(v: Vendor) {
  return { role: "merchant", vendorId: v.id, slug: v.slug };
}

async function findByEmail(email: string) {
  return exactEmailMatch(await hexclave.listUsers({ query: email, limit: 20 }), email) ?? null;
}

/** Which other live store, if any, already owns this Hexclave user. */
async function ownerOf(userId: string, exceptVendorId: string) {
  const [row] = await getDb()
    .select({ name: vendors.name })
    .from(vendors)
    .where(and(eq(vendors.loginUserId, userId), ne(vendors.id, exceptVendorId)))
    .limit(1);
  return row ?? null;
}

/** Creates, adopts or resets the owner's login and sets its password. Returns the Hexclave user id. */
export async function syncMerchantAccount(vendor: Vendor, loginId: string, password: string): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = merchantLoginEmail(loginId);
  let user = vendor.loginUserId ? await hexclave.getUser(vendor.loginUserId) : null;
  if (!user) {
    user = await findByEmail(email);
    if (user) {
      const owner = await ownerOf(user.id, vendor.id);
      if (owner) return { ok: false, error: `The login ID "${loginId}" belongs to ${owner.name}. Change this store's login ID first.` };
    }
  }
  if (user) {
    await user.update({ password, displayName: vendor.name, primaryEmail: email, primaryEmailVerified: true, primaryEmailAuthEnabled: true, serverMetadata: metadata(vendor) });
    return { ok: true, userId: user.id };
  }
  const created = await hexclave.createUser({
    primaryEmail: email,
    primaryEmailVerified: true,
    primaryEmailAuthEnabled: true,
    password,
    displayName: vendor.name,
    serverMetadata: metadata(vendor),
  });
  return { ok: true, userId: created.id };
}

/** Moves a login to a new ID, clearing the way if an orphaned account still holds that email. */
export async function renameMerchantAccount(vendor: Vendor & { loginUserId: string }, loginId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = merchantLoginEmail(loginId);
  const user = await hexclave.getUser(vendor.loginUserId);
  if (!user) return { ok: false, error: "The login account is missing. Generate a new login." };
  const holder = await findByEmail(email);
  if (holder && holder.id !== user.id) {
    const owner = await ownerOf(holder.id, vendor.id);
    if (owner) return { ok: false, error: `The login ID "${loginId}" belongs to ${owner.name}.` };
    await holder.delete(); // orphan: no store links to it
  }
  await user.update({ primaryEmail: email, primaryEmailVerified: true, primaryEmailAuthEnabled: true, serverMetadata: metadata(vendor) });
  return { ok: true };
}
