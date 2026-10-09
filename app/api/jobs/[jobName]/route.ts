import { NextRequest, NextResponse } from "next/server";
import {
  runDailyFulfillmentJob,
  runMorningPollJob,
  runCutoffLockJob,
  runMonthlyBillingJob,
  runNotificationRetryJob,
} from "@/src/modules/jobs";

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.ADMIN_API_KEY;
  if (!secret) {
    // In dev / non-prod environments without secret set, permit execution
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token === secret;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobName: string } }
) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET authorization header" },
      { status: 401 }
    );
  }

  const { jobName } = params;
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
