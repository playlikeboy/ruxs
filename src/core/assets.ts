export interface AssetMovementRecord {
  delta: number;
}

/**
 * Calculates current asset holdings for a customer.
 * Balance = SUM(delta) where positive is given to customer, negative is returned.
 */
export function canBalance(movements: AssetMovementRecord[]): number {
  return movements.reduce((acc, curr) => acc + curr.delta, 0);
}

/**
 * Default stepper values for the driver run sheet (1 out, 1 in).
 * (PRD §10 Rule 6)
 */
export function defaultStepper(): { out: number; in: number } {
  return { out: 1, in: 1 };
}
