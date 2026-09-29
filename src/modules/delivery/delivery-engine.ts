import {
  DeliveryRun,
  DeliveryStop,
  DeliveryRunSchema,
  DeliveryStopSchema,
} from "./delivery-schema";
import { FulfillmentStateMachine } from "../fulfillment/fulfillment-fsm";
import { AssetLedgerService } from "../assets/asset-ledger";
import { db, isTestEnv } from "../../shared/db";
import { deliveryRuns as deliveryRunsTable, deliveryStops as deliveryStopsTable } from "../../shared/db/schema";
import { eq } from "drizzle-orm";

const runsStore = new Map<string, DeliveryRun>();

export interface GenerateRunSheetInput {
  tenantId: string;
  driverId: string;
  driverName: string;
  date: string;
  shift: "MORNING" | "LUNCH" | "EVENING";
  items: Array<{
    fulfillmentId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    society: string;
    tower: string;
    floor: number;
    flat: string;
    serviceName: string;
    quantity: number;
    isSkipped?: boolean;
    dropPreference?: "DOORSTEP" | "SECURITY_GATE" | "NEIGHBOR" | "HANDOVER";
    notes?: string;
  }>;
}

export class DeliveryEngine {
  /**
   * Generates a sequence-ordered run sheet clustered by Society -> Tower -> Floor (Top-Down elevator route)
   */
  static generateRunSheet(input: GenerateRunSheetInput): DeliveryRun {
    const runId = `run_${input.date}_${input.shift.toLowerCase()}_${input.driverId}`;

    // Sort by Society -> Tower -> Floor (descending: 14th floor down to 1st floor) -> Flat
    const sortedItems = [...input.items].sort((a, b) => {
      const societyCmp = a.society.localeCompare(b.society);
      if (societyCmp !== 0) return societyCmp;

      const towerCmp = a.tower.localeCompare(b.tower);
      if (towerCmp !== 0) return towerCmp;

      // Descending floor for elevator convenience
      if (b.floor !== a.floor) return b.floor - a.floor;

      return a.flat.localeCompare(b.flat);
    });

    let skippedCount = 0;

    const stops: DeliveryStop[] = sortedItems.map((item, index) => {
      const isSkipped = !!item.isSkipped;
      if (isSkipped) skippedCount++;

      return DeliveryStopSchema.parse({
        id: `stop_${runId}_${index + 1}`,
        fulfillmentId: item.fulfillmentId,
        tenantId: input.tenantId,
        customerId: item.customerId,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        society: item.society,
        tower: item.tower,
        floor: item.floor,
        flat: item.flat,
        serviceName: item.serviceName,
        quantity: item.quantity,
        status: isSkipped ? "SKIPPED" : "PENDING",
        dropPreference: item.dropPreference || "DOORSTEP",
        notes: item.notes,
      });
    });

    const run: DeliveryRun = DeliveryRunSchema.parse({
      id: runId,
      tenantId: input.tenantId,
      driverId: input.driverId,
      driverName: input.driverName,
      date: input.date,
      shift: input.shift,
      stops,
      totalStops: stops.length,
      completedStops: 0,
      skippedStops: skippedCount,
      failedStops: 0,
      status: stops.length === skippedCount ? "COMPLETED" : "NOT_STARTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    runsStore.set(runId, run);
    return run;
  }

  /**
   * Seeds baseline operational delivery runs for Milk, Water, and Tiffin if empty
   */
  static seedDefaultRunsIfEmpty(): DeliveryRun[] {
    if (runsStore.size > 0) return Array.from(runsStore.values());

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Lunch Tiffin Run (Sharma Tiffin)
    const lunchRun = this.generateRunSheet({
      tenantId: "ten_sharma_tiffin",
      driverId: "drv_ramesh",
      driverName: "Ramesh Kumar",
      date: todayStr,
      shift: "LUNCH",
      items: [
        {
          fulfillmentId: "ful_01",
          customerId: "usr_priya",
          customerName: "Priya Sundaram",
          customerPhone: "+91 98765 43210",
          society: "Sobha Classic",
          tower: "Tower B",
          floor: 4,
          flat: "B-402",
          serviceName: "Daily Executive Veg Lunch",
          quantity: 1,
          dropPreference: "DOORSTEP",
          notes: "Ring doorbell once, leave on shoe rack",
        },
        {
          fulfillmentId: "ful_02",
          customerId: "usr_rahul",
          customerName: "Rahul Verma",
          customerPhone: "+91 98765 43211",
          society: "Sobha Classic",
          tower: "Tower B",
          floor: 1,
          flat: "B-101",
          serviceName: "Daily Executive Veg Lunch",
          quantity: 1,
          dropPreference: "HANDOVER",
          notes: "Hand over directly to security if flat bell unacknowledged",
        },
        {
          fulfillmentId: "ful_03",
          customerId: "usr_ananya",
          customerName: "Ananya Deshmukh",
          customerPhone: "+91 98765 43217",
          society: "Sobha Classic",
          tower: "Tower A",
          floor: 8,
          flat: "A-804",
          serviceName: "Jain Satvik Thali",
          quantity: 1,
          dropPreference: "DOORSTEP",
        },
        {
          fulfillmentId: "ful_04",
          customerId: "usr_suresh",
          customerName: "Suresh Nair",
          customerPhone: "+91 98765 43288",
          society: "Sobha Classic",
          tower: "Tower C",
          floor: 2,
          flat: "C-203",
          serviceName: "Homestyle Dal Roti",
          quantity: 2,
          dropPreference: "SECURITY_GATE",
        },
      ],
    });

    // Mark stop 1 delivered to demonstrate realistic live progress
    if (lunchRun.stops[0]) {
      lunchRun.stops[0].status = "DELIVERED";
      lunchRun.stops[0].deliveredAt = "12:15 PM";
      lunchRun.stops[0].assetDelivered = 1;
      lunchRun.stops[0].assetCollected = 1;
      lunchRun.completedStops = 1;
      lunchRun.status = "IN_PROGRESS";
    }

    // Also support canonical demo run ID
    runsStore.set("run_2026-09-12_lunch_drv_ramesh", lunchRun);
    runsStore.set(lunchRun.id, lunchRun);

    // 2. Morning Milk Run (Gupta Pure Cow Milk)
    const milkRun = this.generateRunSheet({
      tenantId: "ten_gupta_dairy",
      driverId: "drv_mahesh",
      driverName: "Mahesh Yadav",
      date: todayStr,
      shift: "MORNING",
      items: [
        {
          fulfillmentId: "ful_milk_01",
          customerId: "usr_priya",
          customerName: "Priya Sundaram",
          customerPhone: "+91 98765 43210",
          society: "Sobha Classic",
          tower: "Tower B",
          floor: 4,
          flat: "B-402",
          serviceName: "Farm Fresh Desi Cow Milk",
          quantity: 2,
          dropPreference: "DOORSTEP",
          notes: "Place glass bottles in insulated milk pouch outside flat",
        },
        {
          fulfillmentId: "ful_milk_02",
          customerId: "usr_rahul",
          customerName: "Rahul Verma",
          customerPhone: "+91 98765 43211",
          society: "Sobha Classic",
          tower: "Tower B",
          floor: 1,
          flat: "B-101",
          serviceName: "Fresh Buffalo Milk",
          quantity: 1,
          dropPreference: "DOORSTEP",
        },
      ],
    });
    runsStore.set(milkRun.id, milkRun);

    return [lunchRun, milkRun];
  }

  /**
   * Retrieves a run sheet by ID
   */
  static getRunSheet(runId: string): DeliveryRun | null {
    if (runsStore.size === 0) {
      this.seedDefaultRunsIfEmpty();
    }
    return runsStore.get(runId) || null;
  }

  /**
   * Retrieves a run sheet by ID from Neon DB or memory fallback
   */
  static async getRunSheetAsync(runId: string): Promise<DeliveryRun | null> {
    if (!isTestEnv) {
      try {
        const [runRow] = await db
          .select()
          .from(deliveryRunsTable)
          .where(eq(deliveryRunsTable.id, runId));

        if (runRow) {
          const stopRows = await db
            .select()
            .from(deliveryStopsTable)
            .where(eq(deliveryStopsTable.runId, runId));

          return {
            id: runRow.id,
            tenantId: runRow.tenantId,
            driverId: runRow.driverId,
            driverName: runRow.driverName,
            date: runRow.date,
            shift: runRow.shift as any,
            totalStops: runRow.totalStops,
            completedStops: runRow.completedStops,
            skippedStops: runRow.skippedStops,
            failedStops: runRow.failedStops,
            status: runRow.status as any,
            createdAt: runRow.createdAt.toISOString(),
            updatedAt: runRow.updatedAt.toISOString(),
            stops: stopRows.map((s) => ({
              id: s.id,
              fulfillmentId: s.fulfillmentId || `ful_${s.id}`,
              tenantId: runRow.tenantId,
              customerId: s.customerId,
              customerName: s.customerName,
              customerPhone: s.customerPhone,
              society: s.society,
              tower: s.tower,
              floor: s.floor,
              flat: s.flat,
              serviceName: s.serviceName,
              quantity: s.quantity,
              status: s.status as any,
              dropPreference: s.dropPreference as any,
              assetCollected: s.assetCollected ?? 0,
              assetDelivered: s.assetDelivered ?? 0,
              deliveredAt: s.deliveredAt ?? undefined,
              failureReason: s.failureReason ?? undefined,
              notes: s.notes ?? undefined,
            })),
          };
        }
      } catch {
        // Fallback
      }
    }

    const run = this.getRunSheet(runId);
    if (run) return run;

    // If still null, ensure seeded and fallback
    this.seedDefaultRunsIfEmpty();
    return runsStore.get(runId) || Array.from(runsStore.values())[0] || null;
  }

  /**
   * Lists all delivery runs matching criteria
   */
  static async listRunsAsync(params?: {
    tenantId?: string;
    driverId?: string;
    date?: string;
    shift?: string;
  }): Promise<DeliveryRun[]> {
    this.seedDefaultRunsIfEmpty();

    if (!isTestEnv) {
      try {
        const rows = await db.select().from(deliveryRunsTable);
        if (rows.length > 0) {
          const matchedRuns: DeliveryRun[] = [];
          for (const row of rows) {
            if (params?.tenantId && row.tenantId !== params.tenantId) continue;
            if (params?.driverId && row.driverId !== params.driverId) continue;
            if (params?.date && row.date !== params.date) continue;
            if (params?.shift && row.shift !== params.shift) continue;

            const fullRun = await this.getRunSheetAsync(row.id);
            if (fullRun) matchedRuns.push(fullRun);
          }
          if (matchedRuns.length > 0) return matchedRuns;
        }
      } catch {
        // Fall back to memory
      }
    }

    const runs = Array.from(runsStore.values());
    const uniqueMap = new Map<string, DeliveryRun>();
    for (const r of runs) {
      uniqueMap.set(r.id, r);
    }

    return Array.from(uniqueMap.values()).filter((r) => {
      if (params?.tenantId && r.tenantId !== params.tenantId) return false;
      if (params?.driverId && r.driverId !== params.driverId) return false;
      if (params?.date && r.date !== params.date) return false;
      if (params?.shift && r.shift !== params.shift) return false;
      return true;
    });
  }

  /**
   * Retrieves the latest active delivery run
   */
  static async getLatestRunAsync(params?: {
    tenantId?: string;
    driverId?: string;
  }): Promise<DeliveryRun | null> {
    const list = await this.listRunsAsync(params);
    return list[0] || null;
  }

  /**
   * Completes a delivery stop (Driver tapped Delivered)
   */
  static async completeStop(params: {
    runId: string;
    stopId: string;
    assetCollected?: number;
    assetDelivered?: number;
    notes?: string;
  }): Promise<{ run: DeliveryRun; stop: DeliveryStop }> {
    const run = runsStore.get(params.runId);
    if (!run) {
      throw new Error(`Delivery run ${params.runId} not found`);
    }

    const stop = run.stops.find((s) => s.id === params.stopId);
    if (!stop) {
      throw new Error(`Stop ${params.stopId} not found in run ${params.runId}`);
    }

    if (stop.status === "SKIPPED") {
      throw new Error("Cannot mark a skipped stop as delivered");
    }

    const wasPending = stop.status === "PENDING";

    stop.status = "DELIVERED";
    stop.deliveredAt = new Date().toISOString();
    if (params.assetCollected !== undefined) stop.assetCollected = params.assetCollected;
    if (params.assetDelivered !== undefined) stop.assetDelivered = params.assetDelivered;
    if (params.notes) stop.notes = params.notes;

    if (wasPending) {
      run.completedStops += 1;
    }

    run.status = "IN_PROGRESS";

    // Reconcile with underlying Fulfillment FSM without bypassing transition rules.
    try {
      const fulfillment = await FulfillmentStateMachine.getByIdAsync(stop.fulfillmentId);
      if (fulfillment) {
        if (fulfillment.status === "IN_PREPARATION" || fulfillment.status === "CONFIRMED") {
          FulfillmentStateMachine.transitionAsync(fulfillment, {
            action: "DISPATCH",
            actionTime: stop.deliveredAt,
            driverId: run.driverId,
          });
        }
        if (fulfillment.status === "OUT_FOR_DELIVERY") {
          FulfillmentStateMachine.transitionAsync(fulfillment, {
            action: "MARK_DELIVERED",
            actionTime: stop.deliveredAt,
            driverId: run.driverId,
          });
        }
      }
    } catch (error) {
      console.error("Failed to reconcile fulfillment state", error);
      throw new Error("Delivery was not recorded because fulfillment state reconciliation failed");
    }

    // Record asset container exchange if tracked
    if ((params.assetCollected && params.assetCollected > 0) || (params.assetDelivered && params.assetDelivered > 0)) {
      try {
        await AssetLedgerService.recordExchange({
          tenantId: run.tenantId,
          customerId: stop.customerId,
          assetType: "TIFFIN_BOX_STEEL",
          quantityDelivered: params.assetDelivered || 0,
          quantityCollected: params.assetCollected || 0,
          referenceId: stop.id,
        });
      } catch {
        // Continue if asset ledger error
      }
    }

    // Check if run is fully completed
    const unresolvedStops = run.stops.filter((s) => s.status === "PENDING");
    if (unresolvedStops.length === 0) {
      run.status = "COMPLETED";
    }

    run.updatedAt = new Date().toISOString();
    runsStore.set(run.id, run);

    if (!isTestEnv) {
      db.update(deliveryStopsTable)
        .set({
          status: "DELIVERED",
          deliveredAt: stop.deliveredAt,
          assetCollected: params.assetCollected || 0,
          assetDelivered: params.assetDelivered || 0,
          notes: params.notes,
        })
        .where(eq(deliveryStopsTable.id, params.stopId))
        .catch(() => {});

      db.update(deliveryRunsTable)
        .set({
          completedStops: run.completedStops,
          status: run.status,
          updatedAt: new Date(),
        })
        .where(eq(deliveryRunsTable.id, params.runId))
        .catch(() => {});
    }

    return { run, stop };
  }

  /**
   * Marks a stop as failed (e.g. Door locked, customer not responding)
   */
  static failStop(params: {
    runId: string;
    stopId: string;
    failureReason: string;
  }): { run: DeliveryRun; stop: DeliveryStop } {
    const run = runsStore.get(params.runId);
    if (!run) {
      throw new Error(`Delivery run ${params.runId} not found`);
    }

    const stop = run.stops.find((s) => s.id === params.stopId);
    if (!stop) {
      throw new Error(`Stop ${params.stopId} not found in run ${params.runId}`);
    }

    if (stop.status === "SKIPPED") {
      throw new Error("Cannot fail a skipped stop");
    }

    const wasPending = stop.status === "PENDING";

    stop.status = "FAILED";
    stop.failureReason = params.failureReason;

    if (wasPending) {
      run.failedStops += 1;
    }

    run.status = "IN_PROGRESS";

    // Reconcile with underlying Fulfillment FSM without bypassing transition rules.
    try {
      const fulfillment = await FulfillmentStateMachine.getByIdAsync(stop.fulfillmentId);
      if (fulfillment) {
        if (fulfillment.status === "IN_PREPARATION" || fulfillment.status === "CONFIRMED") {
          FulfillmentStateMachine.transitionAsync(fulfillment, {
            action: "DISPATCH",
            actionTime: new Date().toISOString(),
            driverId: run.driverId,
          });
        }
        if (fulfillment.status === "OUT_FOR_DELIVERY") {
          FulfillmentStateMachine.transitionAsync(fulfillment, {
            action: "MARK_FAILED",
            actionTime: new Date().toISOString(),
            notes: params.failureReason,
            driverId: run.driverId,
          });
        }
      }
    } catch (error) {
      console.error("Failed to reconcile fulfillment state", error);
      throw new Error("Delivery was not recorded because fulfillment state reconciliation failed");
    }

    const unresolvedStops = run.stops.filter((s) => s.status === "PENDING");
    if (unresolvedStops.length === 0) {
      run.status = "COMPLETED";
    }

    run.updatedAt = new Date().toISOString();
    runsStore.set(run.id, run);

    if (!isTestEnv) {
      db.update(deliveryStopsTable)
        .set({
          status: "FAILED",
          failureReason: params.failureReason,
        })
        .where(eq(deliveryStopsTable.id, params.stopId))
        .catch(() => {});

      db.update(deliveryRunsTable)
        .set({
          failedStops: run.failedStops,
          status: run.status,
          updatedAt: new Date(),
        })
        .where(eq(deliveryRunsTable.id, params.runId))
        .catch(() => {});
    }

    return { run, stop };
  }
}
