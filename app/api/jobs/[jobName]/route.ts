import { NextRequest, NextResponse } from "next/server";
import {
  runDailyFulfillmentJob,
  runMorningPollJob,
  runCutoffLockJob,
  runMonthlyBillingJob,
  runNotificationRetryJob,
} from "@/src/modules/jobs";

import { checkRateLimit, getClientIp } from "@/src/shared/utils/rate-limit";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function verifyCronAuth(request: NextRequest): boolean {
  const isProd = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
  const secret = process.env.CRON_SECRET || process.env.ADMIN_API_KEY;

  if (!secret) {
    // In production, CRON_SECRET or ADMIN_API_KEY is strictly mandatory
    if (isProd) return false;
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return constantTimeEqual(token, secret);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobName: string }> }
) {
  const ip = getClientIp(request.headers);
  const ipLimit = await checkRateLimit(`cron_ip:${ip}`, 30, 60);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many cron trigger attempts. Please wait." },
      { status: 429 }
    );
  }

  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET authorization header" },
      { status: 401 }
    );
  }

  const { jobName } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const force = Boolean(body?.force);

  try {
    let result;
    switch (jobName) {
      case "daily-fulfillment":
        result = await runDailyFulfillmentJob(body?.targetDate, { force });
        break;
      case "morning-poll":
        result = await runMorningPollJob(body?.targetDate, { force });
        break;
      case "cutoff-lock":
        result = await runCutoffLockJob(body?.targetDate, { force });
        break;
      case "monthly-billing":
        result = await runMonthlyBillingJob(body?.targetYearMonth, { force });
        break;
      case "notification-retry":
        result = await runNotificationRetryJob({ force });
        break;
      default:
        return NextResponse.json(
          {
            error: `Unknown job '${jobName}'. Available jobs: daily-fulfillment, morning-poll, cutoff-lock, monthly-billing, notification-retry`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      jobName: result.jobName,
      jobKey: result.jobKey,
      alreadyRan: result.alreadyRan,
      durationMs: result.durationMs,
      result: result.result,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Job execution exception", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
