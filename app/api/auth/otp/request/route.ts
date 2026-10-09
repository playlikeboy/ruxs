import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPhoneOtp } from "@/src/shared/auth/otp";
import { createErrorResponse, createSuccessResponse } from "@/src/shared/errors";
import { getEnv } from "@/src/shared/config/env";
import { checkRateLimit, getClientIp } from "@/src/shared/utils/rate-limit";

const RequestOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must have at least 10 digits"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = RequestOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_FAILED", "Please enter a valid 10-digit mobile number", parsed.error.format()),
        { status: 400 }
      );
    }

    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimit(`otp_req_ip:${ip}`, 10, 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createErrorResponse("RATE_LIMITED", "Too many OTP requests from this IP. Please wait a minute."),
        { status: 429, headers: { "Retry-After": String(ipLimit.resetSeconds) } }
      );
    }

    const env = getEnv();
    const isDev = env.APP_ENV === "development";

    const result = await requestPhoneOtp(parsed.data.phone, { isDev });

    return NextResponse.json(
      createSuccessResponse({
        phone: result.phone,
        message: isDev ? `OTP generated: ${result.debugCode} (or use 123456)` : "OTP dispatched via WhatsApp / SMS",
        expiresAt: result.expiresAt,
        ...(isDev ? { debugCode: result.debugCode } : {}),
      })
    );
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to process OTP request";
    const isRateLimited = message.includes("Too many OTP requests");
    return NextResponse.json(
      createErrorResponse(isRateLimited ? "RATE_LIMITED" : "INTERNAL_SERVER_ERROR", isRateLimited ? message : "Failed to process OTP request"),
      { status: isRateLimited ? 429 : 500 }
    );
  }
}
