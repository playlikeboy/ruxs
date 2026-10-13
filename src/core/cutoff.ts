import { istDateTime } from "./time";

export type LateRule = "free" | "half" | "full" | "locked";

export interface LateChargeResult {
  refused: boolean;
  chargePaise: number;
}

/**
 * A tap is late when its timestamp is strictly greater than the cutoff time on that service date in IST.
 * (PRD §10 Rule 1)
 */
export function isLate(tapAt: Date, serviceDate: string, cutoffAt: string): boolean {
  const cutoffMoment = istDateTime(serviceDate, cutoffAt);
  return tapAt.getTime() > cutoffMoment.getTime();
}

/**
 * Calculates the late charge based on the vendor's policy.
 * - free: 0 charge
 * - half: 50% of (qty * unitPaise), rounded half up to whole paise
 * - full: 100% of (qty * unitPaise)
 * - locked: refused (order remains locked, cannot be skipped)
 */
export function lateCharge(
  rule: LateRule,
  qty: number,
  unitPaise: number
): LateChargeResult {
  if (rule === "locked") {
    return { refused: true, chargePaise: 0 };
  }

  if (rule === "free") {
    return { refused: false, chargePaise: 0 };
  }

  if (rule === "half") {
    const rawHalf = (qty * unitPaise) / 2;
    return { refused: false, chargePaise: Math.round(rawHalf) };
  }

  // "full"
  return { refused: false, chargePaise: qty * unitPaise };
}
