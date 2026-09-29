import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_USERS, verifyPhoneOtp } from "@/src/shared/auth/otp";
import { signSessionJwt, type UserRole } from "@/src/shared/auth/jwt";
import { normalizeIndianPhone } from "@/src/shared/auth/phone";
import { createErrorResponse, createSuccessResponse } from "@/src/shared/errors";
import { getEnv } from "@/src/shared/config/env";
import { db, isTestEnv, users } from "@/src/shared/db";
import { eq } from "drizzle-orm";

const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export async function POST(request: Request) {
  try {
    const parsed = VerifyOtpSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json(
      createErrorResponse("VALIDATION_FAILED", "Invalid OTP verification payload", parsed.error.format()),
      { status: 400 }
    );

    const env = getEnv();
    const isDev = env.APP_ENV === "development";
    const normalizedPhone = normalizeIndianPhone(parsed.data.phone);

    if (!await verifyPhoneOtp(normalizedPhone, parsed.data.code, { isDev })) {
      return NextResponse.json(createErrorResponse("UNAUTHORIZED", "Invalid or expired OTP. Please try again."), { status: 401 });
    }

    let dbUser: { id: string; role: string; tenantId: string | null } | undefined;
    if (!isTestEnv) {
      try {
        dbUser = (await db.select({ id: users.id, role: users.role, tenantId: users.tenantId })
          .from(users).where(eq(users.phone, normalizedPhone)).limit(1))[0];
      } catch {
        dbUser = undefined;
      }
    }

    const demo = isDev ? DEMO_USERS.find((u) => normalizeIndianPhone(u.phone) === normalizedPhone) : undefined;
    const role = (dbUser?.role || demo?.role || "CUSTOMER") as UserRole;
    const userId = dbUser?.id || `usr_${normalizedPhone.replace("+", "")}`;
    const tenantId = dbUser?.tenantId || undefined;

    const token = await signSessionJwt({ sub: userId, phone: normalizedPhone, role, tenantId }, env.JWT_SIGNING_SECRET);
    const response = NextResponse.json(createSuccessResponse({ user: { id: userId, phone: normalizedPhone, role } }));
    response.cookies.set("ruxs_session", token, {
      httpOnly: true,
      secure: env.APP_ENV !== "development",
      sameSite: "lax",
      maxAge: 12 * 60 * 60,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to verify OTP"), { status: 500 });
  }
}
