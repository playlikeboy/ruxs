import { JobRunner, JobExecutionResult } from "./job-runner";
import { NotificationService } from "../notifications/notification-service";
import { db, isTestEnv } from "../../shared/db";
import { dailyFulfillments, users, subscriptions, products } from "../../shared/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { getISTDateString } from "../../shared/utils/date-time";

export async function runMorningPollJob(
  targetDate?: string,
  options?: { force?: boolean }
): Promise<JobExecutionResult<{ polledCount: number; date: string }>> {
  const serviceDate = targetDate || getISTDateString();
  const jobKey = `morning_poll:${serviceDate}`;

  return JobRunner.execute(
    "morning_poll",
    jobKey,
    async () => {
      let polledCount = 0;

      if (!isTestEnv) {
        const rows = await db
          .select({
            fulfillment: dailyFulfillments,
            customerName: users.fullName,
            customerPhone: users.phone,
            whatsappOptIn: users.whatsappOptIn,
            productName: products.name,
          })
          .from(dailyFulfillments)
          .leftJoin(users, eq(dailyFulfillments.customerId, users.id))
          .leftJoin(subscriptions, eq(dailyFulfillments.subscriptionId, subscriptions.id))
          .leftJoin(products, eq(subscriptions.productId, products.id))
          .where(
            and(
              eq(dailyFulfillments.serviceDate, serviceDate),
              or(
                eq(dailyFulfillments.status, "SCHEDULED"),
                eq(dailyFulfillments.status, "CONFIRMATION_REQUIRED")
              )
            )
          );

        for (const row of rows) {
          if (!row.customerPhone) continue;

          try {
            await NotificationService.dispatchNotification({
              tenantId: row.fulfillment.tenantId,
              customerId: row.fulfillment.customerId,
              recipientPhone: row.customerPhone,
              eventType: "DAILY_POLL",
              whatsappOptIn: row.whatsappOptIn ?? true,
              params: {
                name: row.customerName || "Customer",
                serviceName: row.productName || "Daily Service",
                cutoffTime: row.fulfillment.cutoffTime
                  ? new Date(row.fulfillment.cutoffTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })
                  : "10:00 AM",
                fulfillmentId: row.fulfillment.id,
              },
            });
            polledCount++;
          } catch (err) {
            console.error(`Failed to send morning poll for fulfillment ${row.fulfillment.id}:`, err);
          }
        }
      }

      return {
        polledCount,
        date: serviceDate,
      };
    },
    options
  );
}
