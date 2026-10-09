import { VendorService } from "@/src/modules/vendor/vendor-service";
import { createSuccessResponse, createErrorResponse } from "@/src/shared/errors";
import { ZodError } from "zod";

import { checkRateLimit, getClientIp } from "@/src/shared/utils/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimit(`vnd_onb_ip:${ip}`, 5, 600);
    if (!ipLimit.allowed) {
      return Response.json(createErrorResponse("RATE_LIMITED", "Too many vendor onboarding attempts. Please wait a few minutes."), {
        status: 429,
        headers: { "Retry-After": String(ipLimit.resetSeconds) },
      });
    }

    const body = await request.json().catch(() => ({}));
    const vendor = await VendorService.onboardVendor(body, { autoApprove: false });
    return Response.json(createSuccessResponse(vendor), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return Response.json(createErrorResponse("VALIDATION_FAILED", error.issues[0]?.message || "Validation failed"), { status: 400 });
    return Response.json(createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to onboard vendor"), { status: 500 });
  }
}
