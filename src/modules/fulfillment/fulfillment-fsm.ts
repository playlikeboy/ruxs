import {
  DailyFulfillment,
  FulfillmentState,
  TransitionAction,
} from "./fulfillment-schema";
import { Paise, calculatePercentage } from "../../shared/types/money";
import { db, isTestEnv } from "../../shared/db";
import {
  dailyFulfillments,
  subscriptions,
  products,
  users,
  households,
} from "../../shared/db/schema";
import { eq, and } from "drizzle-orm";

const fulfillmentStore = new Map<string, DailyFulfillment>();

export class FulfillmentStateMachine {
  /**
   * Evaluates and applies a state transition to an existing daily fulfillment
   */
  static transition(
    fulfillment: DailyFulfillment,
    action: TransitionAction
  ): DailyFulfillment {
    const current = fulfillment.status;
    const now = action.actionTime ? new Date(action.actionTime) : new Date();
    const cutoff = new Date(fulfillment.cutoffTime);

    switch (action.action) {
      case "REQUEST_CONFIRMATION":
        if (current !== "SCHEDULED") {
          throw new Error(`Cannot request confirmation from state ${current}`);
        }
        fulfillment.status = "CONFIRMATION_REQUIRED";
        break;

      case "CONFIRM":
        if (current !== "SCHEDULED" && current !== "CONFIRMATION_REQUIRED") {
          // Idempotency: if already confirmed, return without error
          if (current === "CONFIRMED") return fulfillment;
          throw new Error(`Cannot confirm fulfillment from state ${current}`);
        }
        fulfillment.status = "CONFIRMED";
        break;

      case "SKIP": {
        // Can skip from SCHEDULED, CONFIRMATION_REQUIRED, or CONFIRMED
        if (current !== "SCHEDULED" && current !== "CONFIRMATION_REQUIRED" && current !== "CONFIRMED") {
          if (current === "SKIPPED" || current === "LATE_SKIP") return fulfillment;
          throw new Error(`Cannot skip fulfillment from state ${current}`);
        }

        // Cutoff Guard: check if current action time is past the cutoff deadline
        if (now.getTime() > cutoff.getTime()) {
          fulfillment.status = "LATE_SKIP";
          // Calculate 50% late cancellation fee
          fulfillment.lateFeePaise = calculatePercentage(fulfillment.totalPricePaise, 50);
          fulfillment.notes = action.notes || "Late skip received past cutoff deadline";
        } else {
          fulfillment.status = "SKIPPED";
          fulfillment.lateFeePaise = 0 as Paise;
          fulfillment.notes = action.notes || "Standard skip confirmed prior to cutoff";
        }
        break;
      }

      case "START_PREP":
        if (current !== "CONFIRMED") {
          if (current === "IN_PREPARATION") return fulfillment;
          throw new Error(`Cannot start preparation for unconfirmed fulfillment (current: ${current})`);
        }
        fulfillment.status = "IN_PREPARATION";
        break;

      case "DISPATCH":
        if (current !== "IN_PREPARATION" && current !== "CONFIRMED") {
          if (current === "OUT_FOR_DELIVERY") return fulfillment;
          throw new Error(`Cannot dispatch fulfillment from state ${current}`);
        }
        fulfillment.status = "OUT_FOR_DELIVERY";
        break;

      case "MARK_DELIVERED":
        if (current !== "OUT_FOR_DELIVERY") {
          // Idempotency check: driver re-tapping delivered due to poor network
          if (current === "DELIVERED") return fulfillment;
          throw new Error(`Cannot mark delivered from state ${current}`);
        }
        fulfillment.status = "DELIVERED";
        fulfillment.deliveredAt = now.toISOString();
        break;

      case "MARK_FAILED":
        if (current !== "OUT_FOR_DELIVERY") {
          throw new Error(`Cannot mark failed from state ${current}`);
        }
        fulfillment.status = "FAILED";
        fulfillment.notes = action.notes || "Delivery attempt failed";
        break;

      case "DISPUTE":
        if (current !== "DELIVERED") {
          throw new Error(`Only delivered fulfillments can be disputed (current: ${current})`);
        }
        fulfillment.status = "DISPUTED";
        fulfillment.notes = action.notes || "Delivery disputed by customer";
        break;

      case "CANCEL":
        if (current === "DELIVERED") {
          throw new Error("Delivered orders cannot be cancelled directly; must go through dispute resolution");
        }
        fulfillment.status = "CANCELLED";
        fulfillment.notes = action.notes || "Cancelled by vendor";
        break;

      default:
        throw new Error(`Unknown transition action: ${(action as any).action}`);
    }

    fulfillment.updatedAt = now.toISOString();
    fulfillmentStore.set(fulfillment.id, fulfillment);

    if (!isTestEnv) {
      db.update(dailyFulfillments)
        .set({
          status: fulfillment.status,
          deliveredAt: fulfillment.deliveredAt ? new Date(fulfillment.deliveredAt) : null,
          notes: fulfillment.notes || null,
          actionTakenAt: now,
        })
        .where(eq(dailyFulfillments.id, fulfillment.id))
        .catch((err) => console.error("Failed to persist fulfillment transition to Neon DB:", err));
    }

    return fulfillment;
  }

  static getById(id: string): DailyFulfillment | null {
    return fulfillmentStore.get(id) || null;
  }

  static async getByIdAsync(id: string): Promise<DailyFulfillment | null> {
    const memory = fulfillmentStore.get(id);
    if (memory) return memory;

    if (!isTestEnv) {
      try {
        const rows = await db
          .select({
            f: dailyFulfillments,
            customerName: users.fullName,
            customerPhone: users.phone,
            productName: products.name,
            productId: products.id,
            societyName: households.societyName,
            towerWing: households.towerWing,
            flatNumber: households.flatNumber,
          })
          .from(dailyFulfillments)
          .leftJoin(users, eq(dailyFulfillments.customerId, users.id))
          .leftJoin(subscriptions, eq(dailyFulfillments.subscriptionId, subscriptions.id))
          .leftJoin(products, eq(subscriptions.productId, products.id))
          .leftJoin(households, eq(dailyFulfillments.householdId, households.id))
          .where(eq(dailyFulfillments.id, id));

        if (rows.length > 0) {
          const r = rows[0];
          const addressSummary = r.societyName
            ? `${r.societyName}, ${r.towerWing}-${r.flatNumber}`
            : undefined;
          const res: DailyFulfillment = {
            id: r.f.id,
            tenantId: r.f.tenantId,
            subscriptionId: r.f.subscriptionId,
            customerId: r.f.customerId,
            customerName: r.customerName || undefined,
            customerPhone: r.customerPhone || undefined,
            householdId: r.f.householdId || undefined,
            addressSummary,
            serviceDate: r.f.serviceDate,
            shift: r.f.shift as any,
            status: r.f.status as any,
            items: [
              {
                productId: r.productId || "prod_default",
                productName: r.productName || "Standard Daily Service",
                quantity: r.f.quantity,
                unitPricePaise: r.f.unitPricePaise as Paise,
                totalPricePaise: r.f.totalPricePaise as Paise,
              },
            ],
            totalPricePaise: r.f.totalPricePaise as Paise,
            cutoffTime: r.f.cutoffTime ? r.f.cutoffTime.toISOString() : "10:00 AM",
            deliveredAt: r.f.deliveredAt ? r.f.deliveredAt.toISOString() : undefined,
            notes: r.f.notes || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          fulfillmentStore.set(res.id, res);
          return res;
        }
      } catch (err) {
        console.error("Failed to fetch fulfillment by ID from Neon DB:", err);
      }
    }

    return null;
  }

  static save(fulfillment: DailyFulfillment): void {
    fulfillmentStore.set(fulfillment.id, fulfillment);
  }

  static listByTenantAndDate(tenantId: string, serviceDate: string): DailyFulfillment[] {
    return Array.from(fulfillmentStore.values()).filter(
      (f) => f.tenantId === tenantId && f.serviceDate === serviceDate
    );
  }

  static async listByTenantAndDateAsync(tenantId: string, serviceDate: string): Promise<DailyFulfillment[]> {
    if (!isTestEnv) {
      try {
        const rows = await db
          .select({
            f: dailyFulfillments,
            customerName: users.fullName,
            customerPhone: users.phone,
            productName: products.name,
            productId: products.id,
            societyName: households.societyName,
            towerWing: households.towerWing,
            flatNumber: households.flatNumber,
          })
          .from(dailyFulfillments)
          .leftJoin(users, eq(dailyFulfillments.customerId, users.id))
          .leftJoin(subscriptions, eq(dailyFulfillments.subscriptionId, subscriptions.id))
          .leftJoin(products, eq(subscriptions.productId, products.id))
          .leftJoin(households, eq(dailyFulfillments.householdId, households.id))
          .where(
            and(
              eq(dailyFulfillments.tenantId, tenantId),
              eq(dailyFulfillments.serviceDate, serviceDate)
            )
          );

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.f.id,
            tenantId: r.f.tenantId,
            subscriptionId: r.f.subscriptionId,
            customerId: r.f.customerId,
            customerName: r.customerName || undefined,
            customerPhone: r.customerPhone || undefined,
            householdId: r.f.householdId || undefined,
            addressSummary: r.societyName ? `${r.societyName}, ${r.towerWing}-${r.flatNumber}` : undefined,
            serviceDate: r.f.serviceDate,
            shift: r.f.shift as any,
            status: r.f.status as any,
            items: [
              {
                productId: r.productId || "prod_default",
                productName: r.productName || "Standard Daily Service",
                quantity: r.f.quantity,
                unitPricePaise: r.f.unitPricePaise as Paise,
                totalPricePaise: r.f.totalPricePaise as Paise,
              },
            ],
            totalPricePaise: r.f.totalPricePaise as Paise,
            cutoffTime: r.f.cutoffTime ? r.f.cutoffTime.toISOString() : "10:00 AM",
            deliveredAt: r.f.deliveredAt ? r.f.deliveredAt.toISOString() : undefined,
            notes: r.f.notes || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.error("Failed to query fulfillments by tenant and date from Neon DB:", err);
      }
    }

    return this.listByTenantAndDate(tenantId, serviceDate);
  }

  static listByCustomer(customerId: string): DailyFulfillment[] {
    return Array.from(fulfillmentStore.values()).filter((f) => f.customerId === customerId);
  }

  static async listByCustomerAsync(customerId: string): Promise<DailyFulfillment[]> {
    if (!isTestEnv) {
      try {
        const rows = await db
          .select({
            f: dailyFulfillments,
            customerName: users.fullName,
            customerPhone: users.phone,
            productName: products.name,
            productId: products.id,
            societyName: households.societyName,
            towerWing: households.towerWing,
            flatNumber: households.flatNumber,
          })
          .from(dailyFulfillments)
          .leftJoin(users, eq(dailyFulfillments.customerId, users.id))
          .leftJoin(subscriptions, eq(dailyFulfillments.subscriptionId, subscriptions.id))
          .leftJoin(products, eq(subscriptions.productId, products.id))
          .leftJoin(households, eq(dailyFulfillments.householdId, households.id))
          .where(eq(dailyFulfillments.customerId, customerId));

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.f.id,
            tenantId: r.f.tenantId,
            subscriptionId: r.f.subscriptionId,
            customerId: r.f.customerId,
            customerName: r.customerName || undefined,
            customerPhone: r.customerPhone || undefined,
            householdId: r.f.householdId || undefined,
            addressSummary: r.societyName ? `${r.societyName}, ${r.towerWing}-${r.flatNumber}` : undefined,
            serviceDate: r.f.serviceDate,
            shift: r.f.shift as any,
            status: r.f.status as any,
            items: [
              {
                productId: r.productId || "prod_default",
                productName: r.productName || "Standard Daily Service",
                quantity: r.f.quantity,
                unitPricePaise: r.f.unitPricePaise as Paise,
                totalPricePaise: r.f.totalPricePaise as Paise,
              },
            ],
            totalPricePaise: r.f.totalPricePaise as Paise,
            cutoffTime: r.f.cutoffTime ? r.f.cutoffTime.toISOString() : "10:00 AM",
            deliveredAt: r.f.deliveredAt ? r.f.deliveredAt.toISOString() : undefined,
            notes: r.f.notes || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.error("Failed to query fulfillments by customer from Neon DB:", err);
      }
    }

    return this.listByCustomer(customerId);
  }

  /**
   * Seeds default demo fulfillments for today if store is empty
   */
  static seedDefaultFulfillmentsIfEmpty(): void {
    if (fulfillmentStore.size > 0) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const cutoffMorning = `${todayStr}T06:30:00.000Z`;
    const cutoffLunch = `${todayStr}T10:00:00.000Z`;

    const sampleFulfillments: DailyFulfillment[] = [
      {
        id: "ful_demo_01",
        tenantId: "ten_sharma_tiffin",
        subscriptionId: "sub_sharma_01",
        customerId: "usr_priya",
        serviceDate: todayStr,
        shift: "LUNCH",
        status: "IN_PREPARATION",
        items: [
          {
            productId: "prod_veg_thali",
            productName: "Standard North Indian Veg Thali",
            quantity: 1,
            unitPricePaise: 12000 as Paise,
            totalPricePaise: 12000 as Paise,
          },
        ],
        totalPricePaise: 12000 as Paise,
        cutoffTime: cutoffLunch,
        notes: "No onions in dal requested",
        createdAt: `${todayStr}T00:01:00Z`,
        updatedAt: `${todayStr}T09:00:00Z`,
      },
      {
        id: "ful_demo_02",
        tenantId: "ten_fresh_dairy",
        subscriptionId: "sub_dairy_02",
        customerId: "usr_verma",
        serviceDate: todayStr,
        shift: "MORNING",
        status: "DELIVERED",
        items: [
          {
            productId: "prod_cow_milk",
            productName: "A2 Farm Fresh Cow Milk 1L",
            quantity: 1,
            unitPricePaise: 7500 as Paise,
            totalPricePaise: 7500 as Paise,
          },
        ],
        totalPricePaise: 7500 as Paise,
        cutoffTime: cutoffMorning,
        deliveredAt: `${todayStr}T06:45:00Z`,
        notes: "Dropped into doorstep insulated milk bag",
        createdAt: `${todayStr}T00:01:00Z`,
        updatedAt: `${todayStr}T06:45:00Z`,
      },
      {
        id: "ful_demo_03",
        tenantId: "ten_pureaqua_water",
        subscriptionId: "sub_water_03",
        customerId: "usr_priya",
        serviceDate: todayStr,
        shift: "MORNING",
        status: "OUT_FOR_DELIVERY",
        items: [
          {
            productId: "prod_water_20l",
            productName: "20-Liter RO Mineral Water Can",
            quantity: 2,
            unitPricePaise: 8000 as Paise,
            totalPricePaise: 16000 as Paise,
          },
        ],
        totalPricePaise: 16000 as Paise,
        cutoffTime: cutoffMorning,
        notes: "Exchange 2 empty jars upon delivery",
        createdAt: `${todayStr}T00:01:00Z`,
        updatedAt: `${todayStr}T07:15:00Z`,
      },
      {
        id: "ful_demo_04",
        tenantId: "ten_pooja_express",
        subscriptionId: "sub_pooja_04",
        customerId: "usr_patel",
        serviceDate: todayStr,
        shift: "MORNING",
        status: "DELIVERED",
        items: [
          {
            productId: "prod_pooja_flowers",
            productName: "Fresh Morning Temple Pooja Flowers",
            quantity: 1,
            unitPricePaise: 3500 as Paise,
            totalPricePaise: 3500 as Paise,
          },
        ],
        totalPricePaise: 3500 as Paise,
        cutoffTime: cutoffMorning,
        deliveredAt: `${todayStr}T06:10:00Z`,
        notes: "Doorstep hook drop completed",
        createdAt: `${todayStr}T00:01:00Z`,
        updatedAt: `${todayStr}T06:10:00Z`,
      },
      {
        id: "ful_demo_05",
        tenantId: "ten_sharma_tiffin",
        subscriptionId: "sub_sharma_05",
        customerId: "usr_patel",
        serviceDate: todayStr,
        shift: "LUNCH",
        status: "CONFIRMATION_REQUIRED",
        items: [
          {
            productId: "prod_special_thali",
            productName: "Executive Paneer Meal Box",
            quantity: 1,
            unitPricePaise: 16000 as Paise,
            totalPricePaise: 16000 as Paise,
          },
        ],
        totalPricePaise: 16000 as Paise,
        cutoffTime: cutoffLunch,
        notes: "Awaiting WhatsApp cutoff response",
        createdAt: `${todayStr}T00:01:00Z`,
        updatedAt: `${todayStr}T00:01:00Z`,
      },
    ];

    for (const f of sampleFulfillments) {
      fulfillmentStore.set(f.id, f);
    }
  }

  /**
   * Returns all fulfillments currently loaded in state machine
   */
  static listAll(): DailyFulfillment[] {
    this.seedDefaultFulfillmentsIfEmpty();
    return Array.from(fulfillmentStore.values());
  }

  static clearStore(): void {
    fulfillmentStore.clear();
  }
}
