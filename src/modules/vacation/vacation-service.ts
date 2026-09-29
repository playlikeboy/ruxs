import {
  VacationPause,
  CreateVacationSchema,
} from "./vacation-schema";
import { db, isTestEnv, vacations as vacationsTable } from "../../shared/db";
import { eq } from "drizzle-orm";

const vacationStore = new Map<string, VacationPause>();

function fromDb(row: typeof vacationsTable.$inferSelect): VacationPause {
  return {
    id: row.id,
    customerId: row.customerId,
    householdId: undefined,
    startDate: row.startDate,
    endDate: row.endDate,
    subscriptionIds: row.subscriptionIds ? JSON.parse(row.subscriptionIds) : [],
    reason: undefined,
    status: row.status as VacationPause["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

export class VacationService {
  static async createVacation(rawInput: unknown): Promise<VacationPause> {
    const validated = CreateVacationSchema.parse(rawInput);
    const vacationId = `vac_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const vacation: VacationPause = {
      id: vacationId,
      customerId: validated.customerId,
      householdId: validated.householdId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      subscriptionIds: validated.subscriptionIds,
      reason: validated.reason,
      status: "ACTIVE",
      createdAt: now,
    };

    if (!isTestEnv) {
      await db.insert(vacationsTable).values({
        id: vacation.id,
        customerId: vacation.customerId,
        startDate: vacation.startDate,
        endDate: vacation.endDate,
        isGlobal: vacation.subscriptionIds.length === 0,
        subscriptionIds: JSON.stringify(vacation.subscriptionIds),
        status: "ACTIVE",
      });
    }

    vacationStore.set(vacationId, vacation);
    return vacation;
  }

  static isSubscriptionPausedOnDate(customerId: string, subscriptionId: string, serviceDate: string): boolean {
    for (const vac of vacationStore.values()) {
      if (vac.customerId !== customerId || vac.status !== "ACTIVE") continue;
      if (serviceDate >= vac.startDate && serviceDate <= vac.endDate) {
        if (vac.subscriptionIds.length === 0 || vac.subscriptionIds.includes(subscriptionId)) return true;
      }
    }
    return false;
  }

  static async hydrate(): Promise<void> {
    if (isTestEnv) return;
    const rows = await db.select().from(vacationsTable).where(eq(vacationsTable.status, "ACTIVE"));
    for (const row of rows) vacationStore.set(row.id, fromDb(row));
  }

  static async resumeEarly(vacationId: string): Promise<VacationPause> {
    const vac = vacationStore.get(vacationId);
    if (!vac) throw new Error("Vacation not found");
    vac.status = "EARLY_RESUMED";
    vac.resumedAt = new Date().toISOString();

    if (!isTestEnv) {
      await db.update(vacationsTable)
        .set({ status: "EARLY_RESUMED" })
        .where(eq(vacationsTable.id, vacationId));
    }

    vacationStore.set(vacationId, vac);
    return vac;
  }

  static async extendVacation(vacationId: string, newEndDate: string): Promise<VacationPause> {
    const vac = vacationStore.get(vacationId);
    if (!vac) throw new Error("Vacation not found");
    if (newEndDate < vac.startDate) throw new Error("New end date cannot precede start date");

    if (!isTestEnv) {
      await db.update(vacationsTable)
        .set({ endDate: newEndDate })
        .where(eq(vacationsTable.id, vacationId));
    }

    vac.endDate = newEndDate;
    vacationStore.set(vacationId, vac);
    return vac;
  }

  static listByCustomer(customerId: string): VacationPause[] {
    return Array.from(vacationStore.values()).filter((v) => v.customerId === customerId);
  }

  static async listByCustomerAsync(customerId: string): Promise<VacationPause[]> {
    if (isTestEnv) return this.listByCustomer(customerId);
    const rows = await db.select().from(vacationsTable).where(eq(vacationsTable.customerId, customerId));
    const result = rows.map(fromDb);
    for (const vacation of result) vacationStore.set(vacation.id, vacation);
    return result;
  }

  static clearStore(): void {
    vacationStore.clear();
  }
}
