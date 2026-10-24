import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, products } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { todayIST, istDateTime } from "@/core/time";
import { lockCutoffForProduct } from "@/features/orders/cutoff-service";
import { generateBillsForVendor } from "@/features/billing/generate-bills";

export async function POST(req: Request) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) {
    return new Response("Cron secret not configured", { status: 500 });
  }

  // Constant-time token verification
  const authHeader = req.headers.get("authorization") || "";
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tokenBuf = Buffer.from(parts[1]);
  const secretBuf = Buffer.from(env.CRON_SECRET);
  if (
    tokenBuf.length !== secretBuf.length ||
    !timingSafeEqual(tokenBuf, secretBuf)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const now = new Date();
  const today = todayIST(now);

  // 1. Lock cutoffs for active vendors whose products passed cutoffAt today
  const activeRows = await db
    .select({
      product: products,
      vendor: vendors,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(vendors.status, "active"));

  let lockedProductsCount = 0;
  for (const { product } of activeRows) {
    const cutoffTime = istDateTime(today, product.cutoffAt);
    if (now.getTime() >= cutoffTime.getTime()) {
      await lockCutoffForProduct(product.id, today, db);
      lockedProductsCount++;
    }
  }

  // 2. Monthly bills on the 1st of month >= 10:00 IST
  let billedVendorsCount = 0;
  const isFirstDay = today.endsWith("-01");
  const tenAmTime = istDateTime(today, "10:00:00");

  if (isFirstDay && now.getTime() >= tenAmTime.getTime()) {
    const parts = today.split("-").map(Number);
    const year = parts[0]!;
    const month = parts[1]!;
    const lastMonthYear = month === 1 ? year - 1 : year;
    const lastMonthNum = month === 1 ? 12 : month - 1;
    const lastMonthPeriod = `${lastMonthYear}-${String(lastMonthNum).padStart(2, "0")}`;

    const activeVendorIds = Array.from(
      new Set(activeRows.map((r) => r.vendor.id))
    );

    for (const vId of activeVendorIds) {
      await generateBillsForVendor(vId, lastMonthPeriod, db);
      billedVendorsCount++;
    }
  }

  return Response.json({
    ok: true,
    serviceDate: today,
    lockedProducts: lockedProductsCount,
    billedVendors: billedVendorsCount,
  });
}
