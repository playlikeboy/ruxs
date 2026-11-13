/**
 * Row → view mapping for store orders. Pure (no database, no auth) so the
 * privacy rule can be unit-tested: the household shapes built here must never
 * carry fulfilment-partner data. Every field is listed by hand on purpose:
 * never spread an order row into a household shape.
 */
import type { storeOrders, storeProducts, storeReturnRequests } from "@/db/schema";
import {
  canCustomerCancel,
  canRequestReturn,
  etaLabel,
  nextReturnStatuses,
  STORE_PAYMENT_HOLD_MINUTES,
  STORE_RETURN_STATUS_LABELS,
  STORE_STATUS_LABELS,
  STORE_TIMELINE,
  stockLabel,
  type StoreOrderStatus,
  type StorePaymentMode,
  type StorePaymentStatus,
  type StoreReturnStatus,
} from "@/core/store";
import type { AdminStoreOrderRow, AdminStoreProductRow, AdminStoreReturn, StoreOrderDetail, StoreOrderItemView, StoreOrderSummary, StoreReturnView } from "./types";

export type StoreOrderRow = typeof storeOrders.$inferSelect;
export type StoreReturnRow = typeof storeReturnRequests.$inferSelect;
export type StoreProductRow = typeof storeProducts.$inferSelect;

export function toOrderSummary(o: StoreOrderRow, items: StoreOrderItemView[]): StoreOrderSummary {
  const status = o.status as StoreOrderStatus;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status,
    statusLabel: STORE_STATUS_LABELS[status] ?? o.status,
    paymentMode: o.paymentMode as StorePaymentMode,
    paymentStatus: o.paymentStatus as StorePaymentStatus,
    totalPaise: o.totalPaise,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    firstItemName: items[0]?.name ?? null,
    firstItemImage: items[0]?.image ?? null,
    createdAt: o.createdAt,
  };
}

export function toReturnView(r: StoreReturnRow): StoreReturnView {
  const status = r.status as StoreReturnStatus;
  return {
    id: r.id,
    status,
    statusLabel: STORE_RETURN_STATUS_LABELS[status] ?? r.status,
    reason: r.reason,
    note: r.adminNote,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export interface OrderDetailContext {
  dispatchDays: number;
  returnWindowDays: number;
  /** The newest return request for this order, if any. */
  returnRequest?: StoreReturnRow | null;
  now?: Date;
}

/** The household's view of one order. Contains no partner, zone or courier-name data. */
export function toOrderDetail(o: StoreOrderRow, items: StoreOrderItemView[], ctx: OrderDetailContext): StoreOrderDetail {
  const now = ctx.now ?? new Date();
  const status = o.status as StoreOrderStatus;
  const at: Record<string, Date | null> = { placed: o.placedAt, packed: o.packedAt, out_for_delivery: o.shippedAt, delivered: o.deliveredAt };
  const reached = STORE_TIMELINE.indexOf(status);
  const payBy = o.paymentMode === "online" && status === "awaiting_payment" ? new Date(o.createdAt.getTime() + STORE_PAYMENT_HOLD_MINUTES * 60_000) : null;
  const returnRequest = ctx.returnRequest ?? null;
  const liveReturn = returnRequest != null && returnRequest.status !== "rejected";
  const eligible = canRequestReturn({ status, deliveredAt: o.deliveredAt }, ctx.returnWindowDays, now);
  return {
    ...toOrderSummary(o, items),
    items,
    subtotalPaise: o.subtotalPaise,
    deliveryFeePaise: o.deliveryFeePaise,
    discountPaise: o.discountPaise,
    couponCode: o.couponCode,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    shipTo:
      o.shipLine1 && o.shipCity && o.shipState && o.shipPincode
        ? { line1: o.shipLine1, line2: o.shipLine2 ?? "", landmark: o.shipLandmark ?? "", city: o.shipCity, state: o.shipState, pincode: o.shipPincode }
        : null,
    etaLabel: o.etaMinDays != null && o.etaMaxDays != null ? etaLabel(o.etaMinDays, o.etaMaxDays) : null,
    etaMinDays: o.etaMinDays,
    etaMaxDays: o.etaMaxDays,
    notes: o.notes,
    shippedBy: "RUXs",
    courier: null,
    trackingNumber: o.trackingNumber,
    cancelReason: o.cancelReason,
    timeline: STORE_TIMELINE.map((s, i) => ({
      status: s,
      label: STORE_STATUS_LABELS[s],
      at: at[s] ?? null,
      done: (reached >= 0 && i <= reached) || at[s] != null,
    })),
    placedAt: o.placedAt,
    packedAt: o.packedAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    returnedAt: o.returnedAt,
    canCancel: canCustomerCancel(status),
    canPay: payBy != null && payBy > now,
    payBy,
    dispatchDays: ctx.dispatchDays,
    canRequestReturn: eligible.ok && !liveReturn,
    returnUntil: eligible.ok ? eligible.until : null,
    returnRequest: returnRequest ? toReturnView(returnRequest) : null,
  };
}

/** Admin list row (seller portal only: includes the partner). */
export function toAdminOrderRow(o: StoreOrderRow, itemCount: number, partnerName: string | null): AdminStoreOrderRow {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as StoreOrderStatus,
    paymentMode: o.paymentMode as StorePaymentMode,
    paymentStatus: o.paymentStatus as StorePaymentStatus,
    totalPaise: o.totalPaise,
    itemCount,
    customerName: o.customerName,
    phone: o.phone,
    createdAt: o.createdAt,
    shipCity: o.shipCity,
    shipState: o.shipState,
    shipPincode: o.shipPincode,
    partnerId: o.partnerId,
    partnerName,
    forwardedAt: o.forwardedAt,
  };
}

/** Seller-portal view of a return request, joined to its order. */
export function toAdminReturn(r: StoreReturnRow, o: Pick<StoreOrderRow, "orderNumber" | "status" | "paymentMode" | "paymentStatus" | "totalPaise" | "customerName" | "phone">): AdminStoreReturn {
  const status = r.status as StoreReturnStatus;
  return {
    id: r.id,
    orderId: r.orderId,
    orderNumber: o.orderNumber,
    orderStatus: o.status as StoreOrderStatus,
    paymentMode: o.paymentMode as StorePaymentMode,
    paymentStatus: o.paymentStatus as StorePaymentStatus,
    totalPaise: o.totalPaise,
    userId: r.userId,
    customerName: o.customerName,
    phone: o.phone,
    reason: r.reason,
    status,
    statusLabel: STORE_RETURN_STATUS_LABELS[status] ?? r.status,
    adminNote: r.adminNote,
    nextStatuses: nextReturnStatuses(status),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    approvedAt: r.approvedAt,
    rejectedAt: r.rejectedAt,
    receivedAt: r.receivedAt,
    refundedAt: r.refundedAt,
  };
}

export function toAdminProductRow(p: StoreProductRow, categoryName: string): AdminStoreProductRow {
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    categoryId: p.categoryId,
    categoryName,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    stock: p.stock,
    lowStockAt: p.lowStockAt,
    stockKind: stockLabel(p.stock, p.lowStockAt).kind,
    image: p.images[0] ?? null,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    archivedAt: p.archivedAt,
    updatedAt: p.updatedAt,
  };
}
