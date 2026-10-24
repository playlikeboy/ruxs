import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { weekdayIST } from "@/core/time";

/**
 * Writes the day's orders for one product in a single idempotent INSERT…SELECT.
 * Internal: called by the cron tick and tests only. Never export this from a "use server" module.
 */
export async function lockCutoffForProduct(
  productId: string,
  serviceDate: string,
  database?: ReturnType<typeof getDb>
) {
  const db = database ?? getDb();
  const weekday = weekdayIST(serviceDate);

  const result = await db.execute(sql`
    INSERT INTO orders (
      id,
      vendor_id,
      customer_id,
      product_id,
      subscription_id,
      service_date,
      shift,
      qty,
      unit_price_paise,
      status,
      created_at
    )
    SELECT
      gen_random_uuid(),
      s.vendor_id,
      s.customer_id,
      s.product_id,
      s.id,
      ${serviceDate}::date,
      p.shift,
      CASE
        WHEN dc.kind = 'skip' THEN 0
        WHEN dc.kind = 'extra' THEN
          CASE WHEN ${weekday} = ANY(s.days) THEN s.qty + dc.qty ELSE dc.qty END
        WHEN dc.kind = 'qty' THEN dc.qty
        ELSE
          CASE WHEN ${weekday} = ANY(s.days) THEN s.qty ELSE 0 END
      END AS qty,
      p.price_paise,
      CASE
        WHEN dc.kind = 'skip' THEN 'skipped'
        WHEN dc.kind = 'extra' THEN
          CASE WHEN (CASE WHEN ${weekday} = ANY(s.days) THEN s.qty + dc.qty ELSE dc.qty END) > 0 THEN 'confirmed' ELSE 'skipped' END
        WHEN dc.kind = 'qty' THEN
          CASE WHEN dc.qty > 0 THEN 'confirmed' ELSE 'skipped' END
        ELSE
          CASE WHEN ${weekday} = ANY(s.days) THEN 'confirmed' ELSE 'skipped' END
      END AS status,
      now()
    FROM subscriptions s
    JOIN products p ON p.id = s.product_id
    JOIN customers c ON c.id = s.customer_id
    LEFT JOIN day_changes dc ON dc.subscription_id = s.id AND dc.service_date = ${serviceDate}::date
    WHERE s.product_id = ${productId}
      AND s.starts_on <= ${serviceDate}::date
      AND (s.ends_on IS NULL OR s.ends_on >= ${serviceDate}::date)
    ON CONFLICT (subscription_id, service_date, shift) DO NOTHING
  `);

  return result;
}

