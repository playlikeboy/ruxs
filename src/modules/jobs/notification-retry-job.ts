import { JobRunner, JobExecutionResult } from "./job-runner";
import { NotificationService } from "../notifications/notification-service";

export async function runNotificationRetryJob(
  options?: { force?: boolean }
): Promise<JobExecutionResult<{ retriedCount: number }>> {
  const timeSlot = Math.floor(Date.now() / (10 * 60 * 1000));
  const jobKey = `notification_retry:${timeSlot}`;

  return JobRunner.execute(
    "notification_retry",
    jobKey,
    async () => {
      const retriedCount = await NotificationService.retryFailedNotificationsAsync();
      return { retriedCount };
    },
    options
  );
}
