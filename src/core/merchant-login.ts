/**
 * Merchant login ids are plain strings (the store slug). Hexclave signs people
 * in by email, so each id maps to a private address on a domain that receives no mail.
 */
export const MERCHANT_LOGIN_DOMAIN = "merchant.ruxs.in";

export function merchantLoginEmail(loginIdOrEmail: string): string {
  const v = loginIdOrEmail.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${MERCHANT_LOGIN_DOMAIN}`;
}

/** Hexclave's user search is fuzzy; only an exact primary-email match is the same login. */
export function exactEmailMatch<T extends { primaryEmail: string | null }>(users: readonly T[], email: string): T | undefined {
  const want = email.trim().toLowerCase();
  return users.find((u) => u.primaryEmail?.toLowerCase() === want);
}
