import { cookies } from "next/headers";
import { getEnv } from "../config/env";
import { verifySessionJwt, type SessionClaims, type UserRole } from "./jwt";

export async function getSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get("ruxs_session")?.value;
  if (!token) return null;
  try {
    return await verifySessionJwt(token, getEnv().JWT_SIGNING_SECRET);
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionClaims> {
  const session = await getSession();
  if (!session) throw new AuthorizationError("UNAUTHORIZED", "Authentication required");
  return session;
}

export function requireRole(session: SessionClaims, roles: UserRole[]): void {
  if (!roles.includes(session.role)) {
    throw new AuthorizationError("FORBIDDEN", "You are not allowed to perform this action");
  }
}

export function assertSelf(session: SessionClaims, userId: string): void {
  if (session.role !== "PLATFORM_ADMIN" && session.sub !== userId) {
    throw new AuthorizationError("FORBIDDEN", "You may only access your own account");
  }
}

export function assertTenant(session: SessionClaims, tenantId: string): void {
  if (session.role === "PLATFORM_ADMIN") return;
  if (!session.tenantId || session.tenantId !== tenantId) {
    throw new AuthorizationError("FORBIDDEN", "You may only access resources in your tenant");
  }
}

export function assertCustomerAccess(session: SessionClaims, customerId: string, tenantId?: string): void {
  if (session.role === "PLATFORM_ADMIN") return;
  if (session.sub === customerId) return;
  if (session.role === "VENDOR_ADMIN" && tenantId && session.tenantId === tenantId) return;
  throw new AuthorizationError("FORBIDDEN", "You may not access this customer");
}

export class AuthorizationError extends Error {
  constructor(public readonly code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
