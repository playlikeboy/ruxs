import "server-only";
import { requireAdmin } from "@/lib/auth/session";

export const SELLER_SIGN_IN = "/seller-portal/sign-in";

/**
 * Guard for every /seller-portal page: the same admins as /admin, but a
 * signed-out visitor lands on the portal's own sign-in. Call it before any
 * store query, so the redirect target never depends on render order.
 */
export function requireSeller() {
  return requireAdmin(SELLER_SIGN_IN);
}
