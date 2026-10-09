import { describe, it, expect } from "bun:test";
import { JobRunner } from "./job-runner";
import { runDailyFulfillmentJob } from "./daily-fulfillment-job";
import { runCutoffLockJob } from "./cutoff-lock-job";
import { runMonthlyBillingJob } from "./monthly-billing-job";

describe("Background Automation Job Runner", () => {
  it("executes a job handler successfully and captures execution metrics", async () => {
    let executed = false;
    const res = await JobRunner.execute("test_job", "test_job_key_1", async () => {
      executed = true;
      return { processed: 42 };
    });

    expect(res.success).toBe(true);
    expect(res.jobName).toBe("test_job");
    expect(res.jobKey).toBe("test_job_key_1");
    expect(res.result).toEqual({ processed: 42 });
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
    expect(executed).toBe(true);
  });

  it("captures failure gracefully without crashing the worker", async () => {
    const res = await JobRunner.execute("failing_job", "failing_job_key_1", async () => {
      throw new Error("Simulated upstream gateway timeout");
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Simulated upstream gateway timeout");
  });

  it("runs daily fulfillment job without errors", async () => {
    const res = await runDailyFulfillmentJob("2026-10-05");
    expect(res.success).toBe(true);
    expect(res.result?.date).toBe("2026-10-05");
  });

  it("runs cutoff lock job without errors", async () => {
    const res = await runCutoffLockJob("2026-10-05");
    expect(res.success).toBe(true);
    expect(res.result?.date).toBe("2026-10-05");
  });

  it("runs monthly billing job without errors", async () => {
    const res = await runMonthlyBillingJob("2026-09");
    expect(res.success).toBe(true);
    expect(res.result?.yearMonth).toBe("2026-09");
  });
});
