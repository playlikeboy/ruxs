import "server-only";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { storeOrders, storeReturnRequests } from "@/db/schema";
import { canRequestReturn, canTransitionReturn, type StoreOrderStatus, type StoreReturnStatus } from "@/core/store";
import { writeStoreAudit } from "./audit";
import { isUniqueViolation, loadStoreSettings, StoreRuleError, type StoreDb } from "./settings";
import { moveStoreOrderInTx, queueStoreEmail, refundStoreOrderCore } from "./settle";
import { queueBackInStock } from "./stock-alerts";

/**
 * Whole-order returns: the household asks within the return window, an admin
 * approves or declines, marks the parcel received (units go back on the shelf
 * as 'return' stock movements, the order becomes `returned`) and refunds.
 * No auth here: callers guard.
 */

type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** A household asks to return a delivered order of theirs. */
export async function requestStoreReturnCore(
  db: StoreDb,
  input: { orderId: string; userId: string; reason: string; now?: Date }
): Promise<Result<{ returnId: string }>> {
  const now = input.now ?? new Date();
  const settings = await loadStoreSettings(db);
  try {
    const returnId = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(storeOrders)
        .where(and(eq(storeOrders.id, input.orderId), eq(storeOrders.userId, input.userId)))
        .limit(1)
        .for("update");
      if (!order) throw new StoreRuleError("Order not found");
      const eligible = canRequestReturn({ status: order.status as StoreOrderStatus, deliveredAt: order.deliveredAt }, settings.returnWindowDays, now);
      if (!eligible.ok) throw new StoreRuleError(eligible.message);
      const [live] = await tx
        .select({ id: storeReturnRequests.id })
        .from(storeReturnRequests)
        .where(and(eq(storeReturnRequests.orderId, order.id), ne(storeReturnRequests.status, "rejected")))
        .limit(1);
      if (live) throw new StoreRuleError("You have already asked to return this order");
      const [row] = await tx
        .insert(storeReturnRequests)
        .values({ orderId: order.id, userId: input.userId, reason: input.reason.trim(), createdAt: now, updatedAt: now })
        .returning({ id: storeReturnRequests.id });
      return row!.id;
    });
    return { ok: true, returnId };
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message };
    if (isUniqueViolation(err)) return { ok: false, error: "You have already asked to return this order" };
    console.error("[store] return request failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not send your return request. Please try again." };
  }
}

/**
 * Admin moves a return: approve, reject, or mark received. Receiving moves the
 * order to `returned` (payment becomes refund_due) and, unless `restock` is
 * false, puts every unit back with a 'return' stock movement.
 */
export async function moveStoreReturn(
  db: StoreDb,
  input: { returnId: string; to: Extract<StoreReturnStatus, "approved" | "rejected" | "received">; actorId: string; note?: string; restock?: boolean; now?: Date }
): Promise<Result<{ returnId: string; orderId: string; status: StoreReturnStatus; restocked: boolean }>> {
  const now = input.now ?? new Date();
  try {
    const out = await db.transaction(async (tx) => {
      const [ret] = await tx.select().from(storeReturnRequests).where(eq(storeReturnRequests.id, input.returnId)).limit(1).for("update");
      if (!ret) throw new StoreRuleError("Return request not found");
      const from = ret.status as StoreReturnStatus;
      if (!canTransitionReturn(from, input.to)) throw new StoreRuleError("This return can't move to that status");

      let restocked = false;
      let backInStock: string[] = [];
      const [order] = await tx.select({ status: storeOrders.status }).from(storeOrders).where(eq(storeOrders.id, ret.orderId)).limit(1).for("update");
      // An order already marked returned from its own page only needs the return closed out.
      if (input.to === "received" && order?.status !== "returned") {
        const moved = await moveStoreOrderInTx(tx, {
          orderId: ret.orderId,
          to: "returned",
          actor: "admin",
          actorId: input.actorId,
          restockReturn: input.restock !== false,
          now,
        });
        restocked = moved.restocked;
        backInStock = moved.backInStock;
      }
      await tx
        .update(storeReturnRequests)
        .set({
          status: input.to,
          updatedAt: now,
          ...(input.note !== undefined ? { adminNote: input.note || null } : {}),
          ...(input.to === "approved" ? { approvedAt: now } : input.to === "rejected" ? { rejectedAt: now } : { receivedAt: now }),
        })
        .where(eq(storeReturnRequests.id, ret.id));
      await writeStoreAudit(
        tx,
        { actorUserId: input.actorId, action: `return.${input.to}`, entity: "return", entityId: ret.id, data: { orderId: ret.orderId, from, restocked, note: input.note ?? null } },
        { strict: true }
      );
      return { returnId: ret.id, orderId: ret.orderId, status: input.to as StoreReturnStatus, restocked, backInStock };
    });
    queueBackInStock(out.backInStock);
    if (input.to === "approved") queueStoreEmail(out.orderId, "return_approved");
    if (input.to === "rejected") queueStoreEmail(out.orderId, "return_rejected");
    return { ok: true, returnId: out.returnId, orderId: out.orderId, status: out.status, restocked: out.restocked };
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message };
    console.error("[store] return move failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not update the return. Please try again." };
  }
}

/** Refunds a received return (Razorpay for online orders, by hand for COD) and closes it. */
export async function refundStoreReturn(
  db: StoreDb,
  input: { returnId: string; actorId: string; note?: string }
): Promise<Result<{ returnId: string; orderId: string; refundId: string | null; amountPaise: number }>> {
  const [ret] = await db.select().from(storeReturnRequests).where(eq(storeReturnRequests.id, input.returnId)).limit(1);
  if (!ret) return { ok: false, error: "Return request not found" };
  if (ret.status !== "received") {
    return { ok: false, error: ret.status === "refunded" ? "This return was already refunded" : "Mark the return received before refunding" };
  }
  const [order] = await db.select({ paymentStatus: storeOrders.paymentStatus, totalPaise: storeOrders.totalPaise }).from(storeOrders).where(eq(storeOrders.id, ret.orderId)).limit(1);
  let refundId: string | null = null;
  let amountPaise = 0;
  // Already refunded from the order page, or nothing was ever paid: just close the return.
  if (order && (order.paymentStatus === "paid" || order.paymentStatus === "refund_due") && order.totalPaise > 0) {
    const r = await refundStoreOrderCore(db, { orderId: ret.orderId, actorId: input.actorId, note: input.note });
    if (!r.ok) return r;
    refundId = r.refundId;
    amountPaise = r.amountPaise;
  }
  const now = new Date();
  const [closed] = await db
    .update(storeReturnRequests)
    .set({ status: "refunded", refundedAt: now, updatedAt: now })
    .where(and(eq(storeReturnRequests.id, ret.id), eq(storeReturnRequests.status, "received")))
    .returning({ id: storeReturnRequests.id });
  if (!closed) return { ok: false, error: "This return was already refunded" };
  await writeStoreAudit(db, {
    actorUserId: input.actorId,
    action: "return.refunded",
    entity: "return",
    entityId: ret.id,
    data: { orderId: ret.orderId, refundId, amountPaise, note: input.note ?? null },
  });
  queueStoreEmail(ret.orderId, "refunded");
  return { ok: true, returnId: ret.id, orderId: ret.orderId, refundId, amountPaise };
}

/** The newest return request per order. */
export async function latestReturnsFor(db: StoreDb, orderIds: string[]) {
  const out = new Map<string, typeof storeReturnRequests.$inferSelect>();
  if (orderIds.length === 0) return out;
  const rows = await db.select().from(storeReturnRequests).where(inArray(storeReturnRequests.orderId, orderIds)).orderBy(desc(storeReturnRequests.createdAt));
  for (const r of rows) if (!out.has(r.orderId)) out.set(r.orderId, r);
  return out;
}
