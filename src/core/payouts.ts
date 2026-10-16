/**
 * Vendor balance for money RUXs collects online. Integer paise only.
 *
 * - settled: paid and earned (plan dues, or app orders that were delivered)
 * - pending: paid for app orders that are still on their way
 * - excluded: paid for orders that were cancelled (refund due or refunded)
 * The RUXs fee is taken from settled money only. Requested and paid payouts
 * both reduce what can still be withdrawn.
 */

export type PaymentState = "settled" | "pending" | "excluded";

export interface BalancePayment {
  amountPaise: number;
  state: PaymentState;
}

export interface BalancePayout {
  amountPaise: number;
  status: "requested" | "paid" | "rejected";
}

export interface VendorBalance {
  settledPaise: number;
  feePaise: number;
  pendingPaise: number;
  withdrawnPaise: number;
  requestedPaise: number;
  availablePaise: number;
}

function assertPaise(n: number, what: string) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`${what} must be non-negative integer paise`);
}

/** RUXs fee in paise, rounded down so the vendor is never charged a fraction extra. */
export function commissionPaise(amountPaise: number, commissionBps: number): number {
  assertPaise(amountPaise, "Amount");
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 5000) {
    throw new Error("Commission must be 0 to 5000 basis points");
  }
  return Math.floor((amountPaise * commissionBps) / 10000);
}

export function vendorBalance(
  payments: BalancePayment[],
  payouts: BalancePayout[],
  commissionBps: number
): VendorBalance {
  let settledPaise = 0;
  let pendingPaise = 0;
  for (const p of payments) {
    assertPaise(p.amountPaise, "Payment");
    if (p.state === "settled") settledPaise += p.amountPaise;
    else if (p.state === "pending") pendingPaise += p.amountPaise;
  }
  let withdrawnPaise = 0;
  let requestedPaise = 0;
  for (const p of payouts) {
    assertPaise(p.amountPaise, "Payout");
    if (p.status === "paid") withdrawnPaise += p.amountPaise;
    else if (p.status === "requested") requestedPaise += p.amountPaise;
  }
  const feePaise = commissionPaise(settledPaise, commissionBps);
  return {
    settledPaise,
    feePaise,
    pendingPaise,
    withdrawnPaise,
    requestedPaise,
    availablePaise: Math.max(0, settledPaise - feePaise - withdrawnPaise - requestedPaise),
  };
}

/** Which bucket a paid online payment falls in, from its order's status. */
export function paymentState(purpose: "shop_order" | "dues", orderStatus: string | null): PaymentState {
  if (purpose === "dues") return "settled";
  if (orderStatus === "delivered") return "settled";
  if (orderStatus === "cancelled" || orderStatus === "rejected") return "excluded";
  return "pending";
}
