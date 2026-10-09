import { JobRunner, JobExecutionResult } from "./job-runner";
import { BillingEngine } from "../billing/billing-engine";
import { db, isTestEnv } from "../../shared/db";
import { subscriptions, khataEntries } from "../../shared/db/schema";
import { eq } from "drizzle-orm";

export async function runMonthlyBillingJob(
  targetYearMonth?: string,
  options?: { force?: boolean }
): Promise<JobExecutionResult<{ invoicesGenerated: number; yearMonth: string }>> {
  // Default to previous month if not specified
  const now = new Date();
  const year = targetYearMonth ? parseInt(targetYearMonth.split("-")[0], 10) : now.getFullYear();
  const month = targetYearMonth ? parseInt(targetYearMonth.split("-")[1], 10) : now.getMonth(); // 1-12 or 0-11
  const actualMonth = targetYearMonth ? month : (month === 0 ? 12 : month);
  const actualYear = targetYearMonth ? year : (month === 0 ? year - 1 : year);

  const monthStr = String(actualMonth).padStart(2, "0");
  const yearMonth = `${actualYear}-${monthStr}`;

  const periodStart = `${yearMonth}-01`;
  const lastDay = new Date(actualYear, actualMonth, 0).getDate();
  const periodEnd = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  const jobKey = `monthly_billing:${yearMonth}`;

  return JobRunner.execute(
    "monthly_billing",
    jobKey,
    async () => {
      let invoicesGenerated = 0;

      if (!isTestEnv) {
        // Collect distinct (tenantId, customerId) pairs with activity
        const subRows = await db
          .select({
            tenantId: subscriptions.tenantId,
            customerId: subscriptions.customerId,
          })
          .from(subscriptions);

        const khataRows = await db
          .select({
            tenantId: khataEntries.tenantId,
            customerId: khataEntries.customerId,
          })
          .from(khataEntries);

        const pairs = new Map<string, { tenantId: string; customerId: string }>();
        for (const r of [...subRows, ...khataRows]) {
          const key = `${r.tenantId}:${r.customerId}`;
          if (!pairs.has(key)) {
            pairs.set(key, { tenantId: r.tenantId, customerId: r.customerId });
          }
        }

        for (const { tenantId, customerId } of pairs.values()) {
          try {
            await BillingEngine.generateInvoice({
              tenantId,
              customerId,
              periodStart,
              periodEnd,
            });
            invoicesGenerated++;
          } catch (err) {
            console.error(`Failed to generate monthly invoice for ${tenantId}/${customerId}:`, err);
          }
        }
      }

      return {
        invoicesGenerated,
        yearMonth,
      };
    },
    options
  );
}
