import "server-only";
import { after } from "next/server";
import { and, asc, eq, gte, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { storeFulfilmentPartners, storeOrderItems, storeOrders, storeProducts } from "@/db/schema";
import { escapeHtml } from "@/core/html";
import { formatINR } from "@/core/money";
import { canForwardStoreOrder, codAmountToCollect, rankFulfilmentPartners, STORE_OPEN_STATUSES, type StoreOrderStatus, type StorePaymentMode, type StorePaymentStatus } from "@/core/store";
import { sendEmail } from "@/features/notifications/service";
import { writeStoreAudit } from "./audit";
import { loadStoreSettings, StoreRuleError, type StoreConn, type StoreDb } from "./settings";
import type { AdminPartnerSuggestion } from "./types";

/**
 * INTERNAL fulfilment: RUXs hands store orders to partner agencies that pack
 * and deliver them. Nothing in this file may be imported by a household-facing
 * page, and nothing here writes to a household email: partners are a business
 * secret, households only ever see "Shipped by RUXs".
 */

type PartnerRow = typeof storeFulfilmentPartners.$inferSelect;

export type PartnerWithWorkload = PartnerRow & { openOrders: number; totalOrders: number };

/** Every partner with how many orders it holds right now and ever. */
export async function loadPartnersWithWorkload(db: StoreConn): Promise<PartnerWithWorkload[]> {
  const [partners, load] = await Promise.all([
    db.select().from(storeFulfilmentPartners).orderBy(asc(storeFulfilmentPartners.name)),
    db
      .select({
        partnerId: storeOrders.partnerId,
        open: sql<number>`count(*) filter (where ${inArray(storeOrders.status, [...STORE_OPEN_STATUSES])})::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(storeOrders)
      .where(isNotNull(storeOrders.partnerId))
      .groupBy(storeOrders.partnerId),
  ]);
  const byId = new Map(load.map((l) => [l.partnerId, l]));
  return partners.map((p) => ({ ...p, openOrders: byId.get(p.id)?.open ?? 0, totalOrders: byId.get(p.id)?.total ?? 0 }));
}

/** Active partners covering a destination, best match first. */
export async function suggestPartners(db: StoreConn, dest: { pincode: string | null; state: string | null }): Promise<AdminPartnerSuggestion[]> {
  const partners = await loadPartnersWithWorkload(db);
  return rankFulfilmentPartners(partners, dest).map(({ partner, score, matchedBy }) => ({
    partnerId: partner.id,
    name: partner.name,
    email: partner.email,
    matchedBy,
    score,
    openOrders: partner.openOrders,
  }));
}

export type ForwardStoreOrderResult =
  | { ok: true; orderId: string; orderNumber: string; partnerId: string; partnerName: string; /** The order was already with another partner. */ reassigned: boolean }
  | { ok: false; error: string; /** A business rule refused it (not a system fault). */ rule?: true };

/**
 * Marks an order as handed to a partner (row-locked) and writes the audit
 * entry in the same transaction. Does not email: call sendPartnerOrderEmail next.
 */
export async function forwardStoreOrderCore(
  db: StoreDb,
  input: { orderId: string; partnerId: string; actorId: string; auto?: boolean; now?: Date }
): Promise<ForwardStoreOrderResult> {
  const now = input.now ?? new Date();
  try {
    return await db.transaction(async (tx) => {
      const [order] = await tx.select().from(storeOrders).where(eq(storeOrders.id, input.orderId)).limit(1).for("update");
      if (!order) throw new StoreRuleError("Order not found");
      if (!canForwardStoreOrder(order.status as StoreOrderStatus)) {
        throw new StoreRuleError("Only orders waiting to be packed or shipped can be forwarded");
      }
      const [partner] = await tx.select().from(storeFulfilmentPartners).where(eq(storeFulfilmentPartners.id, input.partnerId)).limit(1);
      if (!partner) throw new StoreRuleError("Partner not found");
      if (!partner.isActive) throw new StoreRuleError(`${partner.name} is switched off. Pick an active partner.`);

      const reassigned = order.partnerId != null && order.partnerId !== partner.id;
      await tx
        .update(storeOrders)
        .set({
          partnerId: partner.id,
          forwardedAt: now,
          forwardEmailedAt: null,
          // A different partner starts with a clean slate.
          ...(reassigned ? { partnerRef: null, partnerStatusNote: null } : {}),
          updatedAt: now,
        })
        .where(eq(storeOrders.id, order.id));
      await writeStoreAudit(
        tx,
        {
          actorUserId: input.actorId,
          action: input.auto ? "order.auto_forward" : "order.forward",
          entity: "order",
          entityId: order.id,
          data: { orderNumber: order.orderNumber, partnerId: partner.id, partnerName: partner.name, previousPartnerId: order.partnerId },
        },
        { strict: true }
      );
      return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber, partnerId: partner.id, partnerName: partner.name, reassigned };
    });
  } catch (err) {
    if (err instanceof StoreRuleError) return { ok: false, error: err.message, rule: true };
    console.error("[store] forward failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "Could not forward the order. Please try again." };
  }
}

export interface PartnerOrderEmail {
  subject: string;
  html: string;
  text: string;
}

/** The order sheet a partner needs to pack and deliver. Every value is escaped. Pure: exported for tests. */
export function buildPartnerOrderEmail(input: {
  orderNumber: string;
  partnerName: string;
  placedAt: Date;
  customerName: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  items: { name: string; sku: string | null; qty: number }[];
  codToCollectPaise: number;
  customerNotes: string | null;
  note: string | null;
}): PartnerOrderEmail {
  const e = escapeHtml;
  const units = input.items.reduce((n, i) => n + i.qty, 0);
  const payment = input.codToCollectPaise > 0 ? `Cash on delivery: collect ${formatINR(input.codToCollectPaise)}` : "Prepaid: collect nothing";
  const placed = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(input.placedAt);
  const cityLine = [input.city, input.state, input.pincode].filter(Boolean).join(", ");
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#716C62;vertical-align:top;white-space:nowrap;">${e(label)}</td><td style="padding:6px 0;color:#20241F;"><strong>${e(value)}</strong></td></tr>`;
  const itemRows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #E9E3D8;">${e(i.name)}</td><td style="padding:8px;border-bottom:1px solid #E9E3D8;">${e(i.sku ?? "-")}</td><td style="padding:8px;border-bottom:1px solid #E9E3D8;text-align:right;"><strong>${e(String(i.qty))}</strong></td></tr>`
    )
    .join("");
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${e(`RUXs order ${input.orderNumber}`)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F7F4ED;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#20241F;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #E9E3D8;border-radius:12px;padding:24px;">
    <p style="margin:0 0 4px;font-size:13px;color:#716C62;">RUXs fulfilment order</p>
    <h1 style="margin:0 0 16px;font-size:20px;">${e(input.orderNumber)}</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Hello ${e(input.partnerName)}, please pack and deliver this order.</p>
    <table cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:16px;">
      ${row("Placed", placed)}
      ${row("Deliver to", input.customerName)}
      ${row("Phone", input.phone)}
      ${row("Address", input.address)}
      ${cityLine ? row("City / State / PIN", cityLine) : ""}
      ${row("Payment", payment)}
      ${input.customerNotes ? row("Customer note", input.customerNotes) : ""}
      ${input.note ? row("Note from RUXs", input.note) : ""}
    </table>
    <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;border:1px solid #E9E3D8;border-radius:8px;">
      <tr style="background:#F7F4ED;"><th align="left" style="padding:8px;">Item</th><th align="left" style="padding:8px;">SKU</th><th align="right" style="padding:8px;">Qty</th></tr>
      ${itemRows}
      <tr><td colspan="2" style="padding:8px;color:#716C62;">Total units</td><td style="padding:8px;text-align:right;"><strong>${e(String(units))}</strong></td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#716C62;">Reply to this email with the tracking reference once the parcel is booked. Use plain packaging and the RUXs name on the label. This order sheet is confidential.</p>
  </div>
</body>
</html>`;
  const text = [
    `RUXs fulfilment order ${input.orderNumber}`,
    `Placed: ${placed}`,
    "",
    `Deliver to: ${input.customerName}`,
    `Phone: ${input.phone}`,
    `Address: ${input.address}`,
    cityLine ? `City / State / PIN: ${cityLine}` : null,
    `Payment: ${payment}`,
    input.customerNotes ? `Customer note: ${input.customerNotes}` : null,
    input.note ? `Note from RUXs: ${input.note}` : null,
    "",
    "Items:",
    ...input.items.map((i) => `- ${i.qty} x ${i.name}${i.sku ? ` (${i.sku})` : ""}`),
    `Total units: ${units}`,
    "",
    "Reply with the tracking reference once the parcel is booked.",
  ]
    .filter((l) => l !== null)
    .join("\n");
  const subject = `RUXs order ${input.orderNumber}: ${units} ${units === 1 ? "unit" : "units"}${input.pincode ? ` to ${input.pincode}` : ""}${input.codToCollectPaise > 0 ? ` (COD ${formatINR(input.codToCollectPaise)})` : " (prepaid)"}`;
  return { subject, html, text };
}

/** Emails the order sheet to the order's partner and stamps forward_emailed_at when it is accepted. */
export async function sendPartnerOrderEmail(db: StoreDb, orderId: string, note?: string | null): Promise<{ ok: boolean; error?: string }> {
  const [row] = await db
    .select({ order: storeOrders, partner: storeFulfilmentPartners })
    .from(storeOrders)
    .innerJoin(storeFulfilmentPartners, eq(storeOrders.partnerId, storeFulfilmentPartners.id))
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  if (!row) return { ok: false, error: "not_forwarded" };
  const items = await db
    .select({ name: storeOrderItems.name, qty: storeOrderItems.qty, sku: storeProducts.sku })
    .from(storeOrderItems)
    .leftJoin(storeProducts, eq(storeOrderItems.productId, storeProducts.id))
    .where(eq(storeOrderItems.orderId, orderId))
    .orderBy(asc(storeOrderItems.name));
  const o = row.order;
  const email = buildPartnerOrderEmail({
    orderNumber: o.orderNumber,
    partnerName: row.partner.contactName || row.partner.name,
    placedAt: o.placedAt ?? o.createdAt,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    city: o.shipCity,
    state: o.shipState,
    pincode: o.shipPincode,
    items,
    codToCollectPaise: codAmountToCollect({
      paymentMode: o.paymentMode as StorePaymentMode,
      paymentStatus: o.paymentStatus as StorePaymentStatus,
      totalPaise: o.totalPaise,
    }),
    customerNotes: o.notes,
    note: note ?? null,
  });
  const sent = await sendEmail({ to: row.partner.email, fromType: "orders", subject: email.subject, html: email.html, text: email.text });
  if (sent.ok) {
    await db
      .update(storeOrders)
      .set({ forwardEmailedAt: new Date() })
      .where(and(eq(storeOrders.id, orderId), eq(storeOrders.partnerId, row.partner.id)));
  }
  return { ok: sent.ok, error: sent.error };
}

export type AutoForwardResult = { forwarded: true; partnerId: string; partnerName: string; emailed: boolean } | { forwarded: false; reason: "off" | "not_ready" | "already_forwarded" | "no_partner" | "error" };

/**
 * When settings.auto_forward is on: sends a freshly placed order (COD, or
 * online once paid) to the best-matching active partner. Safe to call twice.
 */
export async function autoForwardStoreOrder(db: StoreDb, orderId: string, opts: { send?: boolean; now?: Date } = {}): Promise<AutoForwardResult> {
  const settings = await loadStoreSettings(db);
  if (!settings.autoForward) return { forwarded: false, reason: "off" };
  const [order] = await db
    .select({ status: storeOrders.status, partnerId: storeOrders.partnerId, pincode: storeOrders.shipPincode, state: storeOrders.shipState })
    .from(storeOrders)
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  if (!order || !canForwardStoreOrder(order.status as StoreOrderStatus)) return { forwarded: false, reason: "not_ready" };
  if (order.partnerId) return { forwarded: false, reason: "already_forwarded" };
  const [best] = await suggestPartners(db, { pincode: order.pincode, state: order.state });
  if (!best) return { forwarded: false, reason: "no_partner" };
  const r = await forwardStoreOrderCore(db, { orderId, partnerId: best.partnerId, actorId: "system", auto: true, now: opts.now });
  if (!r.ok) return { forwarded: false, reason: r.rule ? "not_ready" : "error" };
  const emailed = opts.send === false ? false : (await sendPartnerOrderEmail(db, orderId)).ok;
  return { forwarded: true, partnerId: r.partnerId, partnerName: r.partnerName, emailed };
}

/** Runs after the response. Never throws; outside a request (tests, scripts) the cron tick picks it up. */
export function queueAutoForward(orderId: string) {
  try {
    after(async () => {
      try {
        await autoForwardStoreOrder(getDb(), orderId);
      } catch (err) {
        console.error("[store] auto-forward failed", err instanceof Error ? err.message : err);
      }
    });
  } catch {
    // after() needs a request scope.
  }
}

/**
 * Cron sweep: auto-forwards anything the request-time hook missed, and resends
 * the order sheet for orders forwarded in the last day whose email never went.
 */
export async function autoForwardPendingOrders(db: StoreDb, now: Date = new Date()): Promise<{ forwarded: number; emailsResent: number; failures: string[] }> {
  const failures: string[] = [];
  let forwarded = 0;
  let emailsResent = 0;
  const settings = await loadStoreSettings(db);
  if (settings.autoForward) {
    const waiting = await db
      .select({ id: storeOrders.id })
      .from(storeOrders)
      .where(and(inArray(storeOrders.status, ["placed", "packed"]), isNull(storeOrders.partnerId)))
      .orderBy(asc(storeOrders.createdAt))
      .limit(50);
    for (const o of waiting) {
      const r = await autoForwardStoreOrder(db, o.id, { now });
      if (r.forwarded) forwarded++;
      else if (r.reason === "error") failures.push(`store-forward:${o.id}`);
    }
  }
  const unsent = await db
    .select({ id: storeOrders.id })
    .from(storeOrders)
    .where(
      and(
        inArray(storeOrders.status, ["placed", "packed"]),
        isNotNull(storeOrders.partnerId),
        isNull(storeOrders.forwardEmailedAt),
        gte(storeOrders.forwardedAt, new Date(now.getTime() - 24 * 60 * 60_000)),
        lt(storeOrders.forwardedAt, new Date(now.getTime() - 2 * 60_000))
      )
    )
    .limit(20);
  for (const o of unsent) {
    if ((await sendPartnerOrderEmail(db, o.id)).ok) emailsResent++;
  }
  return { forwarded, emailsResent, failures };
}
