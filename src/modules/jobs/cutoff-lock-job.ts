import { JobRunner, JobExecutionResult } from "./job-runner";
import { CutoffEngine } from "../cutoff/cutoff-engine";
import { db, isTestEnv } from "../../shared/db";
import { tenants } from "../../shared/db/schema";
import { getISTDateString } from "../../shared/utils/date-time";

export async function runCutoffLockJob(
  targetDate?: string,
  options?: { force?: boolean }
): Promise<JobExecutionResult<{ totalLocked: number; date: string }>> {
  const serviceDate = targetDate || getISTDateString();
  const timeSlot = Math.floor(Date.now() / (15 * 60 * 1000));
  const jobKey = `cutoff_lock:${serviceDate}:${timeSlot}`;

  return JobRunner.execute(
    "cutoff_lock",
    jobKey,
    async () => {
      let totalLocked = 0;

      if (!isTestEnv) {
        const tenantRows = await db.select({ id: tenants.id }).from(tenants);

        for (const t of tenantRows) {
          try {
            const res = await CutoffEngine.lockExpiredCutoffsAsync(t.id, serviceDate);
            totalLocked += res.lockedCount;
          } catch (err) {
            console.error(`Failed to lock cutoffs for tenant ${t.id}:`, err);
          }
        }
      }

      return {
        totalLocked,
        date: serviceDate,
      };
    },
    options
  );
}
