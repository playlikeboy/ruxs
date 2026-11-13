import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, products } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { todayIST, istDateTime } from "@/core/time";
import { lockCutoffForProduct } from "@/features/orders/cutoff-service";
import { generateBillsForVendor } from "@/features/billing/generate-bills";
import { sendTomorrowReminders } from "@/features/notifications/reminders";
import { isEveningReminderWindow } from "@/core/reminders";
import { releaseExpiredStoreOrders } from "@/features/store/settle";
import { autoForwardPendingOrders } from "@/features/store/fulfilment";
import { sendBackInStockAlerts } from "@/features/store/stock-alerts";

/** Constant-time compare of two secrets; hashing first hides the length too. */
function secretMatches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function POST(req: Request) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) {
    return new Response("Cron secret not configured", { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const [scheme, token, ...rest] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token || rest.length > 0 || !secretMatches(token, env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const now = new Date();
  const today = todayIST(now);
  // One failing product or vendor must not stop the rest of the tick; each
  // step is idempotent, so the next tick retries whatever failed here.
  const failures: string[] = [];

  // 1. Lock cutoffs for active vendors whose products passed cutoffAt today
  const activeRows = await db
    .select({ productId: products.id, cutoffAt: products.cutoffAt, vendorId: vendors.id })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(vendors.status, "active"));

  let lockedProductsCount = 0;
  for (const row of activeRows) {
    const cutoffTime = istDateTime(today, row.cutoffAt);
    if (now.getTime() < cutoffTime.getTime()) continue;
    try {
      await lockCutoffForProduct(row.productId, today, db);
      lockedProductsCount++;
    } catch (err) {
      console.error("[cron] cutoff lock failed", { productId: row.productId, error: errorMessage(err) });
      failures.push(`cutoff:${row.productId}`);
    }
  }

  // 2. Monthly bills on the 1st of month >= 10:00 IST
  let billedVendorsCount = 0;
  const isFirstDay = today.endsWith("-01");
  const tenAmTime = istDateTime(today, "10:00:00");

  if (isFirstDay && now.getTime() >= tenAmTime.getTime()) {
    const [year, month] = today.split("-").map(Number) as [number, number];
    const lastMonthYear = month === 1 ? year - 1 : year;
    const lastMonthNum = month === 1 ? 12 : month - 1;
    const lastMonthPeriod = `${lastMonthYear}-${String(lastMonthNum).padStart(2, "0")}`;

    const activeVendorIds = Array.from(new Set(activeRows.map((r) => r.vendorId)));

    for (const vendorId of activeVendorIds) {
      try {
        await generateBillsForVendor(vendorId, lastMonthPeriod, db);
        billedVendorsCount++;
      } catch (err) {
        console.error("[cron] bill generation failed", { vendorId, period: lastMonthPeriod, error: errorMessage(err) });
        failures.push(`bill:${vendorId}`);
      }
    }
  }

  // 3. Evening reminders for tomorrow's sessions (18:00 IST, deduped per booking)
  let reminders: Awaited<ReturnType<typeof sendTomorrowReminders>> | null = null;
  if (isEveningReminderWindow(now)) {
    try {
      reminders = await sendTomorrowReminders(now);
    } catch (err) {
      console.error("[cron] reminders failed", { error: errorMessage(err) });
      failures.push("reminders");
    }
  }

  // 4. RUXs Store: release stock held by online orders that were never paid
  let storeReleased = 0;
  try {
    const released = await releaseExpiredStoreOrders(db, now);
    storeReleased = released.released;
    failures.push(...released.failures);
  } catch (err) {
    console.error("[cron] store hold release failed", { error: errorMessage(err) });
    failures.push("store-holds");
  }

  // 5. RUXs Store: hand placed orders to fulfilment (when auto-forward is on) and
  //    resend order sheets that never went out. Internal: nothing here reaches households.
  let storeForwarded = 0;
  try {
    const forwarded = await autoForwardPendingOrders(db, now);
    storeForwarded = forwarded.forwarded;
    failures.push(...forwarded.failures);
  } catch (err) {
    console.error("[cron] store forwarding failed", { error: errorMessage(err) });
    failures.push("store-forward");
  }

  // 6. RUXs Store: back-in-stock emails the request-time hook missed (each alert is sent once)
  let storeStockAlerts = 0;
  try {
    storeStockAlerts = (await sendBackInStockAlerts(db)).notified;
  } catch (err) {
    console.error("[cron] store stock alerts failed", { error: errorMessage(err) });
    failures.push("store-stock-alerts");
  }

  return Response.json(
    {
      ok: failures.length === 0,
      serviceDate: today,
      lockedProducts: lockedProductsCount,
      billedVendors: billedVendorsCount,
      reminders,
      storeReleased,
      storeForwarded,
      storeStockAlerts,
      failures,
    },
    { status: failures.length === 0 ? 200 : 500 }
  );
}
