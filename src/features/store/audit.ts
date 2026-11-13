import "server-only";
import { storeAuditLog } from "@/db/schema";
import type { StoreConn } from "./settings";

export interface StoreAuditEntry {
  /** Admin user id, or "system" for cron/auto actions. */
  actorUserId: string;
  /** "<entity>.<verb>", e.g. "order.forward". */
  action: string;
  entity: "order" | "product" | "category" | "settings" | "zone" | "partner" | "coupon" | "review" | "return" | "collection" | "stock" | "export";
  entityId?: string | null;
  data?: Record<string, unknown>;
}

/**
 * Appends to the insert-only store_audit_log. Pass the transaction to make the
 * entry atomic with the change. Outside a transaction a failed write is logged
 * and swallowed: the audit trail must not turn a finished action into an error.
 */
export async function writeStoreAudit(db: StoreConn, entry: StoreAuditEntry, opts: { strict?: boolean } = {}): Promise<void> {
  const values = {
    actorUserId: entry.actorUserId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    data: entry.data ?? {},
  };
  if (opts.strict) {
    await db.insert(storeAuditLog).values(values);
    return;
  }
  try {
    await db.insert(storeAuditLog).values(values);
  } catch (err) {
    console.error("[store] audit write failed", entry.action, err instanceof Error ? err.message : err);
  }
}
