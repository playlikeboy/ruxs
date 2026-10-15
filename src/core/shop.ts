/**
 * Pure rules for one-time cart orders placed from the RUXS app.
 * Money is integer paise. No db, next or react imports.
 */

export const MAX_LINE_QTY = 20;

export type ShopOrderStatus =
  | "placed"
  | "accepted"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

export type ShopActor = "consumer" | "vendor" | "admin";

export interface CartLine {
  unitPricePaise: number;
  qty: number;
}

export interface CartTotals {
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  itemCount: number;
}

/** Sums a cart. Throws on non-integer money or quantities out of range. */
export function cartTotals(lines: CartLine[], deliveryFeePaise: number): CartTotals {
  if (!Number.isInteger(deliveryFeePaise) || deliveryFeePaise < 0) {
    throw new Error("Delivery fee must be non-negative integer paise");
  }
  let subtotalPaise = 0;
  let itemCount = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.unitPricePaise) || line.unitPricePaise < 0) {
      throw new Error("Price must be non-negative integer paise");
    }
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_LINE_QTY) {
      throw new Error(`Quantity must be between 1 and ${MAX_LINE_QTY}`);
    }
    subtotalPaise += line.unitPricePaise * line.qty;
    itemCount += line.qty;
  }
  const fee = lines.length === 0 ? 0 : deliveryFeePaise;
  return { subtotalPaise, deliveryFeePaise: fee, totalPaise: subtotalPaise + fee, itemCount };
}

const VENDOR_FLOW: Partial<Record<ShopOrderStatus, ShopOrderStatus[]>> = {
  placed: ["accepted", "rejected"],
  accepted: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
};

/** Who may move an order from one status to another. */
export function canTransition(
  from: ShopOrderStatus,
  to: ShopOrderStatus,
  actor: ShopActor
): boolean {
  if (from === to) return false;
  if (from === "delivered" || from === "cancelled" || from === "rejected") return false;
  if (actor === "consumer") return from === "placed" && to === "cancelled";
  if (actor === "vendor") return VENDOR_FLOW[from]?.includes(to) ?? false;
  // Admin can resolve any open order to any status.
  return true;
}

/** The next forward step a vendor would normally take, for one-tap buttons. */
export function nextVendorStep(status: ShopOrderStatus): ShopOrderStatus | null {
  if (status === "placed") return "accepted";
  if (status === "accepted") return "out_for_delivery";
  if (status === "out_for_delivery") return "delivered";
  return null;
}

export function isOpenStatus(status: ShopOrderStatus): boolean {
  return status === "placed" || status === "accepted" || status === "out_for_delivery";
}

export const STATUS_LABEL: Record<ShopOrderStatus, string> = {
  placed: "Order placed",
  accepted: "Being prepared",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Declined by store",
};

/** Human order number, e.g. RX-1015-4K7Q, built from IST date and a random suffix. */
export function formatOrderNumber(serviceDate: string, suffix: string): string {
  const mmdd = serviceDate.slice(5, 7) + serviceDate.slice(8, 10);
  return `RX-${mmdd}-${suffix.toUpperCase()}`;
}

/** Ledger lines for a delivered order: a charge, plus a matching payment when paid on delivery. */
export function deliveredLedgerLines(
  totalPaise: number,
  paymentMode: "cod" | "monthly_bill"
): { type: "delivery" | "payment"; amountPaise: number }[] {
  const lines: { type: "delivery" | "payment"; amountPaise: number }[] = [
    { type: "delivery", amountPaise: totalPaise },
  ];
  if (paymentMode === "cod") lines.push({ type: "payment", amountPaise: -totalPaise });
  return lines;
}
