export interface SubscriptionSnapshot {
  qty: number;
  days: string[];
}

export interface DayChangeSnapshot {
  kind: "skip" | "extra" | "qty";
  qty: number;
}

export interface ResolvedDay {
  status: "confirmed" | "skipped";
  qty: number;
}

/**
 * Resolves a day's order quantity and status based on a subscription and any day change.
 * This pure function mirrors the logic executed by the cutoff SQL INSERT ... SELECT.
 * (PRD §10 Rule 3)
 */
export function resolveDay(
  subscription: SubscriptionSnapshot,
  change: DayChangeSnapshot | null,
  weekday: string
): ResolvedDay {
  const isScheduledDay = subscription.days.includes(weekday.toLowerCase());

  // If no change was made: default subscription runs on scheduled days
  if (!change) {
    if (!isScheduledDay) {
      return { status: "skipped", qty: 0 };
    }
    return { status: "confirmed", qty: subscription.qty };
  }

  // Handle explicit day changes
  if (change.kind === "skip") {
    return { status: "skipped", qty: 0 };
  }

  if (change.kind === "extra") {
    const baseQty = isScheduledDay ? subscription.qty : 0;
    const finalQty = baseQty + change.qty;
    return {
      status: finalQty > 0 ? "confirmed" : "skipped",
      qty: finalQty,
    };
  }

  if (change.kind === "qty") {
    return {
      status: change.qty > 0 ? "confirmed" : "skipped",
      qty: Math.max(0, change.qty),
    };
  }

  return { status: "skipped", qty: 0 };
}
