import { Subscription } from "../subscriptions/subscription-schema";
import { SubscriptionEngine } from "../subscriptions/subscription-engine";
import { DailyFulfillment, FulfillmentItemSnapshot } from "./fulfillment-schema";
import { FulfillmentStateMachine } from "./fulfillment-fsm";
import { VacationService } from "../vacation/vacation-service";
import { Paise } from "../../shared/types/money";
import { db, isTestEnv, dailyFulfillments } from "../../shared/db";
import { and, eq, inArray } from "drizzle-orm";

export interface GenerateFulfillmentsOptions {
  serviceDate: string; // YYYY-MM-DD
  cutoffTimeStr?: string; // e.g., "10:00"
  shift?: "MORNING" | "LUNCH" | "EVENING" | "NIGHT";
}

export class FulfillmentGenerator {
  /**
   * Generates daily fulfillment records for all active subscriptions scheduled on serviceDate
   */
  static async generateForDateAsync(
    subscriptions: Subscription[],
    options: GenerateFulfillmentsOptions
  ): Promise<DailyFulfillment[]> {
    if (isTestEnv) return this.generateForDate(subscriptions, options);

    const { serviceDate, shift = "LUNCH" } = options;
    const subscriptionIds = subscriptions.map((s) => s.id);
    const existingRows = subscriptionIds.length
      ? await db.select({
          subscriptionId: dailyFulfillments.subscriptionId,
          shift: dailyFulfillments.shift,
        }).from(dailyFulfillments).where(and(
          eq(dailyFulfillments.serviceDate, serviceDate),
          inArray(dailyFulfillments.subscriptionId, subscriptionIds),
        ))
      : [];

    const existing = new Set(existingRows.map((r) => `${r.subscriptionId}:${r.shift}`));
    const pending = subscriptions.filter((sub) => !existing.has(`${sub.id}:${shift}`));
    const generated = this.generateForDate(pending, options);

    for (const fulfillment of generated) {
      await db.insert(dailyFulfillments).values({
        id: fulfillment.id,
        tenantId: fulfillment.tenantId,
        subscriptionId: fulfillment.subscriptionId,
        customerId: fulfillment.customerId,
        householdId: fulfillment.householdId || null,
        serviceDate: fulfillment.serviceDate,
        shift: fulfillment.shift,
        status: fulfillment.status,
        quantity: fulfillment.items[0]?.quantity || 0,
        unitPricePaise: Number(fulfillment.items[0]?.unitPricePaise || 0),
        totalPricePaise: Number(fulfillment.totalPricePaise),
        cutoffTime: new Date(fulfillment.cutoffTime),
        deliveredAt: fulfillment.deliveredAt ? new Date(fulfillment.deliveredAt) : null,
        notes: fulfillment.notes || null,
      });
    }

    return generated;
  }

  static generateForDate(
    subscriptions: Subscription[],
    options: GenerateFulfillmentsOptions
  ): DailyFulfillment[] {
    const { serviceDate, cutoffTimeStr = "10:00", shift = "LUNCH" } = options;
    const cutoffDateTime = `${serviceDate}T${cutoffTimeStr}:00.000Z`;
    const now = new Date().toISOString();

    const createdList: DailyFulfillment[] = [];

    for (const sub of subscriptions) {
      // 1. Check if subscription is scheduled for this calendar date
      if (!SubscriptionEngine.isScheduledOnDate(sub, serviceDate)) {
        continue;
      }

      // 2. Vacation Mode Guard: Check if subscription is paused under an active vacation window
      if (VacationService.isSubscriptionPausedOnDate(sub.customerId, sub.id, serviceDate)) {
        continue;
      }

      const fulfillmentId = `ful_${crypto.randomUUID()}`;
      const totalAmountPaise = (sub.unitPricePaise * sub.defaultQuantity) as Paise;

      // Freeze product and price snapshot
      const itemSnapshot: FulfillmentItemSnapshot = {
        productId: sub.productId,
        productName: sub.productName,
        quantity: sub.defaultQuantity,
        unitPricePaise: sub.unitPricePaise,
        totalPricePaise: totalAmountPaise,
      };

      const initialStatus = sub.autopilotDefault === "CONFIRMED" ? "CONFIRMED" : "SCHEDULED";

      const record: DailyFulfillment = {
        id: fulfillmentId,
        tenantId: sub.tenantId,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        householdId: sub.householdId,
        serviceDate,
        shift,
        status: initialStatus,
        items: [itemSnapshot],
        totalPricePaise: totalAmountPaise,
        cutoffTime: cutoffDateTime,
        createdAt: now,
        updatedAt: now,
      };

      FulfillmentStateMachine.save(record);
      createdList.push(record);
    }

    return createdList;
  }
}
