import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/src/shared/config/env";
import { verifySessionJwt } from "@/src/shared/auth/jwt";

const PUBLIC_API = new Set([
  "/api/auth/otp/request",
  "/api/auth/otp/verify",
  "/api/auth/destination",
  "/api/auth/session",
  "/api/auth/logout",
  "/api/hello",
  "/api/marketplace/vendors",
  "/api/vendor/profile",
  "/api/payments/webhook",
  "/api/webhooks/whatsapp",
]);

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/") || PUBLIC_API.has(path)) return NextResponse.next();

  const token = request.cookies.get("ruxs_session")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  try {
    const session = await verifySessionJwt(token, getEnv().JWT_SIGNING_SECRET);
    if (!session) throw new Error("invalid session");
    const headers = new Headers(request.headers);
    headers.set("x-ruxs-user-id", session.sub);
    headers.set("x-ruxs-role", session.role);
    if (session.tenantId) headers.set("x-ruxs-tenant-id", session.tenantId);
    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired session" } },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
