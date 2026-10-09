import { JobRunner, JobExecutionResult } from "./job-runner";
import { FulfillmentGenerator } from "../fulfillment/fulfillment-generator";
import { db, isTestEnv } from "../../shared/db";
import { subscriptions, products, users } from "../../shared/db/schema";
import { eq } from "drizzle-orm";
import { getISTDateString } from "../../shared/utils/date-time";
import { Subscription } from "../subscriptions/subscription-schema";

export async function runDailyFulfillmentJob(
  targetDate?: string,
  options?: { force?: boolean }
): Promise<JobExecutionResult<{ count: number; date: string }>> {
  const serviceDate = targetDate || getISTDateString();
  const jobKey = `daily_fulfillment:${serviceDate}`;

  return JobRunner.execute(
    "daily_fulfillment",
    jobKey,
    async () => {
      let activeSubs: Subscription[] = [];

      if (!isTestEnv) {
        const rows = await db
          .select({
            sub: subscriptions,
            productName: products.name,
            productPrice: products.basePricePaise,
            customerName: users.fullName,
            customerPhone: users.phone,
          })
          .from(subscriptions)
          .leftJoin(products, eq(subscriptions.productId, products.id))
          .leftJoin(users, eq(subscriptions.customerId, users.id))
          .where(eq(subscriptions.status, "ACTIVE"));

        activeSubs = rows.map((r) => ({
          id: r.sub.id,
          tenantId: r.sub.tenantId,
          customerId: r.sub.customerId,
          householdId: r.sub.householdId || undefined,
          productId: r.sub.productId,
          productName: r.productName || "Standard Subscription",
          unitPricePaise: (r.productPrice ?? 0) as any,
          cadence: (r.sub.cadence as any) || "DAILY",
          shift: r.sub.shift || "LUNCH",
          selectedDays: r.sub.selectedDays
            ? r.sub.selectedDays.split(",").map((s) => parseInt(s.trim(), 10))
            : undefined,
          defaultQuantity: r.sub.defaultQuantity,
          autopilotDefault: (r.sub.autopilotDefault as any) || "CONFIRMED",
          instructions: r.sub.instructions || undefined,
          status: (r.sub.status as any) || "ACTIVE",
          startDate: r.sub.startDate,
          endDate: r.sub.endDate || undefined,
          createdAt: r.sub.createdAt.toISOString(),
          updatedAt: r.sub.createdAt.toISOString(),
        }));
      }

      const generated = await FulfillmentGenerator.generateForDateAsync(activeSubs, {
        serviceDate,
        cutoffTimeStr: "10:00",
        shift: "LUNCH",
      });

      return {
        count: generated.length,
        date: serviceDate,
      };
    },
    options
  );
}
