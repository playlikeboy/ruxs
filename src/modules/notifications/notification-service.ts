import {
  NotificationRecord,
  DispatchNotificationInput,
  DispatchNotificationSchema,
} from "./notification-schema";
import { isQuietHours } from "../../shared/utils/date-time";
import { WhatsAppProvider, SmsProvider, InAppProvider } from "./providers";
import { db, isTestEnv } from "../../shared/db";
import { notifications, tenants, users } from "../../shared/db/schema";
import { eq, desc, and, or, inArray, lt } from "drizzle-orm";

const notificationStore: NotificationRecord[] = [];

export class NotificationService {
  /**
   * Compiles notification text from event type and dynamic parameters
   */
  static compileTemplate(eventType: string, params: Record<string, any>): { title: string; body: string } {
    switch (eventType) {
      case "DAILY_POLL":
        return {
          title: "RUXS Daily Service Poll",
          body: `Hi ${params.name || "there"}, delivering your ${params.serviceName || "tiffin"} today? Cutoff is at ${params.cutoffTime || "10:00 AM"}. Tap below to Skip or Confirm.`,
        };
      case "OUT_FOR_DELIVERY":
        return {
          title: "Delivery En Route",
          body: `Your ${params.serviceName || "order"} is out for delivery with driver ${params.driverName || "assigned to your route"}.`,
        };
      case "DELIVERED":
        return {
          title: "Doorstep Delivery Complete",
          body: `Your ${params.serviceName || "service"} was delivered to ${params.address || "your door"}. Added to your Khata ledger.`,
        };
      case "INVOICE_GENERATED":
        return {
          title: "Monthly Statement Ready",
          body: `Your statement for ${params.month || "this month"} of ₹${params.amountRupees || "0"} is ready. Pay seamlessly.`,
        };
      case "PAYMENT_RECEIVED":
        return {
          title: "Payment Confirmed",
          body: `Received ₹${params.amountRupees || "0"}. Your Khata ledger balance has been updated.`,
        };
      default:
        return {
          title: "RUXS Alert",
          body: "You have a new update regarding your household services.",
        };
    }
  }

  /**
   * Checks whether the current time falls inside quiet hours (10:00 PM to 07:00 AM IST)
   */
  static isQuietHours(timeDate: Date = new Date()): boolean {
    return isQuietHours(timeDate);
  }

  /**
   * Dispatches a notification across the priority channel stack:
   * WhatsApp (if opted-in and provider available) -> DLT SMS Fallback -> In-App
   */
  static async dispatchNotification(rawInput: unknown): Promise<NotificationRecord> {
    const validated = DispatchNotificationSchema.parse(rawInput);
    const { title, body } = this.compileTemplate(validated.eventType, validated.params);

    const now = validated.scheduledTime ? new Date(validated.scheduledTime) : new Date();

    // Check quiet hours for non-urgent notifications (Invoices)
    if (validated.eventType === "INVOICE_GENERATED" && this.isQuietHours(now)) {
      throw new Error("Cannot dispatch non-urgent billing notification during quiet hours (10 PM - 7 AM)");
    }

    const notifId = `not_${Math.random().toString(36).substring(2, 11)}`;

    let primaryChannel: "WHATSAPP" | "SMS" = "WHATSAPP";
    let fallbackChannel: "SMS" | undefined = undefined;
    let status: "SENT" | "FALLBACK_TRIGGERED" | "FAILED" = "SENT";
    let providerMessageId = "";

    // If user has not opted into WhatsApp, route directly to SMS
    if (!validated.whatsappOptIn) {
      primaryChannel = "SMS";
      const res = await SmsProvider.send(validated.recipientPhone, body);
      providerMessageId = res.providerMessageId;
    } else {
      // Primary: WhatsApp
      const waRes = await WhatsAppProvider.send(validated.recipientPhone, body);
      if (waRes.success) {
        providerMessageId = waRes.providerMessageId;
      } else {
        // Fallback to SMS
        fallbackChannel = "SMS";
        status = "FALLBACK_TRIGGERED";
        const smsRes = await SmsProvider.send(validated.recipientPhone, body);
        providerMessageId = smsRes.providerMessageId;
      }
    }

    const record: NotificationRecord = {
      id: notifId,
      tenantId: validated.tenantId,
      customerId: validated.customerId,
      recipientPhone: validated.recipientPhone,
      channel: primaryChannel,
      eventType: validated.eventType,
      title,
      body,
      status,
      fallbackChannel,
      providerMessageId: providerMessageId || undefined,
      metadata: validated.params,
      createdAt: now.toISOString(),
    };

    notificationStore.push(record);

    // Persist to Neon PostgreSQL Outbox
    if (!isTestEnv) {
      try {
        let validTenantId: string | null = null;
        let validCustomerId: string | null = null;

        // Verify foreign keys if provided
        if (validated.tenantId) {
          const tenantExists = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.id, validated.tenantId))
            .limit(1);
          if (tenantExists.length > 0) validTenantId = validated.tenantId;
        }

        if (validated.customerId) {
          const custExists = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, validated.customerId))
            .limit(1);
          if (custExists.length > 0) validCustomerId = validated.customerId;
        }

        await db.insert(notifications).values({
          id: record.id,
          tenantId: validTenantId,
          customerId: validCustomerId,
          recipientPhone: record.recipientPhone,
          channel: record.channel,
          eventType: record.eventType,
          title: record.title,
          body: record.body,
          status: record.status,
          fallbackChannel: record.fallbackChannel || null,
          providerMessageId: record.providerMessageId || null,
          scheduledTime: validated.scheduledTime ? new Date(validated.scheduledTime) : null,
          sentTime: now,
          metadata: JSON.stringify(record.metadata || {}),
        });
      } catch (err) {
        console.error("Failed to persist notification outbox entry to Neon DB:", err);
      }
    }

    return record;
  }

  /**
   * Simulates a delivery failure on primary WhatsApp channel triggering automatic SMS fallback
   */
  static async triggerFallback(notificationId: string): Promise<NotificationRecord> {
    const notif = notificationStore.find((n) => n.id === notificationId);
    if (!notif) throw new Error("Notification not found");

    notif.status = "FALLBACK_TRIGGERED";
    notif.fallbackChannel = "SMS";

    if (!isTestEnv) {
      try {
        await db
          .update(notifications)
          .set({
            status: "FALLBACK_TRIGGERED",
            fallbackChannel: "SMS",
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, notificationId));
      } catch (err) {
        console.error("Failed to update notification fallback in DB:", err);
      }
    }

    return notif;
  }

  /**
   * Retries failed notifications from the outbox
   */
  static async retryFailedNotificationsAsync(maxRetries: number = 3): Promise<number> {
    if (isTestEnv) return 0;

    let retried = 0;
    try {
      const pendingRows = await db
        .select()
        .from(notifications)
        .where(
          and(
            or(eq(notifications.status, "PENDING"), eq(notifications.status, "FAILED")),
            lt(notifications.retryCount, maxRetries)
          )
        )
        .limit(50);

      for (const row of pendingRows) {
        try {
          // Route fallback if needed
          const targetChannel = row.fallbackChannel || (row.channel === "WHATSAPP" ? "SMS" : row.channel);
          let sendRes;
          if (targetChannel === "SMS") {
            sendRes = await SmsProvider.send(row.recipientPhone, row.body);
          } else {
            sendRes = await WhatsAppProvider.send(row.recipientPhone, row.body);
          }

          if (sendRes.success) {
            await db
              .update(notifications)
              .set({
                status: "SENT",
                providerMessageId: sendRes.providerMessageId,
                sentTime: new Date(),
                retryCount: row.retryCount + 1,
                updatedAt: new Date(),
              })
              .where(eq(notifications.id, row.id));
            retried++;
          } else {
            await db
              .update(notifications)
              .set({
                status: "FAILED",
                retryCount: row.retryCount + 1,
                errorMessage: sendRes.error || "Retry failed",
                updatedAt: new Date(),
              })
              .where(eq(notifications.id, row.id));
          }
        } catch (err: any) {
          await db
            .update(notifications)
            .set({
              retryCount: row.retryCount + 1,
              errorMessage: err?.message || "Retry exception",
              updatedAt: new Date(),
            })
            .where(eq(notifications.id, row.id));
        }
      }
    } catch (err) {
      console.error("Failed to process notification retry batch:", err);
    }

    return retried;
  }

  static getFeedForCustomer(customerId: string): NotificationRecord[] {
    return notificationStore.filter((n) => n.customerId === customerId);
  }

  static async getFeedForCustomerAsync(customerId: string): Promise<NotificationRecord[]> {
    if (!isTestEnv) {
      try {
        const rows = await db
          .select()
          .from(notifications)
          .where(eq(notifications.customerId, customerId))
          .orderBy(desc(notifications.createdAt))
          .limit(50);

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            tenantId: r.tenantId || "",
            customerId: r.customerId || "",
            recipientPhone: r.recipientPhone,
            channel: r.channel as any,
            eventType: r.eventType as any,
            title: r.title,
            body: r.body,
            status: r.status as any,
            fallbackChannel: (r.fallbackChannel as any) || undefined,
            providerMessageId: r.providerMessageId || undefined,
            metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
            createdAt: r.createdAt.toISOString(),
          }));
        }
      } catch (err) {
        console.error("Failed to query notifications feed from Neon DB:", err);
      }
    }

    return this.getFeedForCustomer(customerId);
  }

  static clearStore(): void {
    notificationStore.length = 0;
  }
}
