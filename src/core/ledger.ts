/**
 * The ledger is insert-only. Every entry carries an idempotency key to prevent double charges.
 * Positive amounts: household owes more money (deliveries, deposits, late fees).
 * Negative amounts: payments or adjustments reducing what the household owes.
 * (PRD §10 Rule 5)
 */

export function deliveryKey(orderId: string): string {
  return `order:${orderId}:delivery`;
}

export function lateFeeKey(orderId: string): string {
  return `order:${orderId}:late`;
}

export function depositKey(customerId: string, asset: string): string {
  return `cust:${customerId}:deposit:${asset}`;
}

export function paymentKey(invoiceId: string, seq: number | string): string {
  return `invoice:${invoiceId}:pay:${seq}`;
}

export function adjustmentKey(uuid: string): string {
  return `adj:${uuid}`;
}

/**
 * Calculates current account balance from append-only ledger entries in integer paise.
 */
export function balance(entries: { amountPaise: number }[]): number {
  return entries.reduce((acc, curr) => acc + curr.amountPaise, 0);
}
