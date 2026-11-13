import "server-only";
import { after } from "next/server";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { storeProducts, storeStockAlerts } from "@/db/schema";
import { formatINR } from "@/core/money";
import { renderEmailHtml, sendUserEmailIfAllowed } from "@/features/notifications/service";
import { APP_URL } from "@/lib/app-url";
import type { StoreDb } from "./settings";

/**
 * Back-in-stock emails. Each alert row is claimed (notified_at set) before its
 * email goes out, so a household hears about a restock once, even when the
 * request-time send and the cron sweep overlap.
 */
export async function sendBackInStockAlerts(
  db: StoreDb,
  opts: { productIds?: string[]; limit?: number; send?: boolean } = {}
): Promise<{ notified: number; products: number }> {
  if (opts.productIds && opts.productIds.length === 0) return { notified: 0, products: 0 };
  const live = and(eq(storeProducts.isActive, true), isNull(storeProducts.archivedAt), gt(storeProducts.stock, 0));
  const pending = await db
    .selectDistinct({ id: storeProducts.id, name: storeProducts.name, slug: storeProducts.slug, pricePaise: storeProducts.pricePaise })
    .from(storeStockAlerts)
    .innerJoin(storeProducts, eq(storeStockAlerts.productId, storeProducts.id))
    .where(and(isNull(storeStockAlerts.notifiedAt), live, opts.productIds ? inArray(storeProducts.id, opts.productIds) : undefined))
    .limit(opts.limit ?? 50);

  let notified = 0;
  for (const p of pending) {
    const claimed = await db
      .update(storeStockAlerts)
      .set({ notifiedAt: new Date() })
      .where(and(eq(storeStockAlerts.productId, p.id), isNull(storeStockAlerts.notifiedAt)))
      .returning({ userId: storeStockAlerts.userId, email: storeStockAlerts.email });
    notified += claimed.length;
    if (opts.send === false) continue;
    const url = `${APP_URL}/app/kids/shop/p/${p.slug}`;
    for (const c of claimed) {
      try {
        await sendUserEmailIfAllowed({
          userId: c.userId,
          to: c.email,
          category: "alerts",
          subject: `${p.name} is back in stock`,
          // renderEmailHtml escapes every value.
          html: renderEmailHtml({
            heading: "Back in stock",
            lead: `${p.name} is available again in the RUXs Store.`,
            details: [{ label: "Price", value: formatINR(p.pricePaise) }],
            actionText: "View product",
            actionUrl: url,
          }),
          text: `${p.name} is back in stock in the RUXs Store: ${url}`,
        });
      } catch (err) {
        console.error("[store] back-in-stock email failed", err instanceof Error ? err.message : err);
      }
    }
  }
  return { notified, products: pending.length };
}

/** Sends after the response. Never throws; outside a request (tests, scripts) the cron tick picks it up. */
export function queueBackInStock(productIds: string[]) {
  if (productIds.length === 0) return;
  try {
    after(async () => {
      try {
        await sendBackInStockAlerts(getDb(), { productIds });
      } catch (err) {
        console.error("[store] back-in-stock alerts failed", err instanceof Error ? err.message : err);
      }
    });
  } catch {
    // after() needs a request scope.
  }
}
