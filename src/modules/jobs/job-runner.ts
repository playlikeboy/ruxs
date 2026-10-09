import { db, isTestEnv } from "../../shared/db";
import { backgroundJobs } from "../../shared/db/schema";
import { eq, sql } from "drizzle-orm";

export interface JobExecutionResult<T = any> {
  jobName: string;
  jobKey: string;
  success: boolean;
  alreadyRan?: boolean;
  result?: T;
  error?: string;
  durationMs: number;
}

export interface JobOptions {
  force?: boolean;
  staleTimeoutMs?: number; // default 10 minutes
}

export class JobRunner {
  /**
   * Executes a background job with distributed DB locking, idempotency guarantees, and audit trail
   */
  static async execute<T>(
    jobName: string,
    jobKey: string,
    handler: () => Promise<T>,
    options: JobOptions = {}
  ): Promise<JobExecutionResult<T>> {
    const startTime = Date.now();
    const staleTimeoutMs = options.staleTimeoutMs ?? 10 * 60 * 1000;

    if (isTestEnv) {
      // In-memory / test execution
      try {
        const result = await handler();
        return {
          jobName,
          jobKey,
          success: true,
          result,
          durationMs: Date.now() - startTime,
        };
      } catch (err: any) {
        return {
          jobName,
          jobKey,
          success: false,
          error: err?.message || String(err),
          durationMs: Date.now() - startTime,
        };
      }
    }

    const jobId = `job_${crypto.randomUUID()}`;

    // 1. Check existing job execution
    const existing = await db
      .select()
      .from(backgroundJobs)
      .where(eq(backgroundJobs.jobKey, jobKey))
      .limit(1);

    if (existing.length > 0 && !options.force) {
      const record = existing[0];
      if (record.status === "COMPLETED") {
        let parsedResult: T | undefined = undefined;
        try {
          if (record.result) parsedResult = JSON.parse(record.result);
        } catch {}

        return {
          jobName,
          jobKey,
          success: true,
          alreadyRan: true,
          result: parsedResult,
          durationMs: Date.now() - startTime,
        };
      }

      if (record.status === "RUNNING") {
        const isStale = Date.now() - record.startedAt.getTime() > staleTimeoutMs;
        if (!isStale) {
          return {
            jobName,
            jobKey,
            success: false,
            error: `Job '${jobName}' (${jobKey}) is currently running on another worker`,
            durationMs: Date.now() - startTime,
          };
        }
        // Stale lock: update and re-claim
        await db
          .update(backgroundJobs)
          .set({
            status: "RUNNING",
            startedAt: new Date(),
            completedAt: null,
            result: null,
          })
          .where(eq(backgroundJobs.id, record.id));
      } else {
        // Was FAILED or reset: re-run
        await db
          .update(backgroundJobs)
          .set({
            status: "RUNNING",
            startedAt: new Date(),
            completedAt: null,
            result: null,
          })
          .where(eq(backgroundJobs.id, record.id));
      }
    } else if (existing.length === 0) {
      // 2. Claim distributed lock via insert
      try {
        await db.insert(backgroundJobs).values({
          id: jobId,
          jobName,
          jobKey,
          status: "RUNNING",
          startedAt: new Date(),
        });
      } catch (err: any) {
        // Race condition: another worker inserted just now
        return {
          jobName,
          jobKey,
          success: false,
          error: `Race condition acquiring lock for job '${jobName}' (${jobKey}): ${err.message}`,
          durationMs: Date.now() - startTime,
        };
      }
    }

    // 3. Execute Handler
    try {
      const result = await handler();
      const completedAt = new Date();
      const serializedResult = result !== undefined ? JSON.stringify(result) : null;

      await db
        .update(backgroundJobs)
        .set({
          status: "COMPLETED",
          completedAt,
          result: serializedResult,
        })
        .where(eq(backgroundJobs.jobKey, jobKey));

      return {
        jobName,
        jobKey,
        success: true,
        result,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      const completedAt = new Date();
      const errorMsg = err?.message || String(err);
      const serializedError = JSON.stringify({ error: errorMsg, stack: err?.stack });

      await db
        .update(backgroundJobs)
        .set({
          status: "FAILED",
          completedAt,
          result: serializedError,
        })
        .where(eq(backgroundJobs.jobKey, jobKey));

      return {
        jobName,
        jobKey,
        success: false,
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }
}
