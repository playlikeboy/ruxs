import { describe, it, expect } from "bun:test";
import { isLate, lateCharge } from "./cutoff";
import { istDateTime } from "./time";
import { deliveryKey, lateFeeKey, balance } from "./ledger";

describe("Launch Gates (Pure Core Rules)", () => {
  // Launch Gate 1: A skip at 10:00:01 is late against 10:00:00
  it("Gate 1: A skip at 10:00:01 is late against 10:00:00 cutoff", () => {
    const serviceDate = "2026-10-14";
    const cutoffAt = "10:00:00";

    const tapExactlyOnCutoff = istDateTime(serviceDate, "10:00:00");
    expect(isLate(tapExactlyOnCutoff, serviceDate, cutoffAt)).toBe(false);

    const tapOneSecondLate = istDateTime(serviceDate, "10:00:01");
    expect(isLate(tapOneSecondLate, serviceDate, cutoffAt)).toBe(true);
  });

  // Launch Gate 2: 100 simulated skips produce zero duplicate charges
  it("Gate 2: 100 simulated skips produce zero duplicate charges", () => {
    const unitPricePaise = 9000;
    const ledger = new Map<string, { amountPaise: number }>();

    for (let i = 1; i <= 100; i++) {
      const orderId = `order_${i}`;
      // Simulate double or triple submission of the same skip event
      for (let attempt = 0; attempt < 3; attempt++) {
        const key = lateFeeKey(orderId);
        if (!ledger.has(key)) {
          const charge = lateCharge("half", 1, unitPricePaise);
          ledger.set(key, { amountPaise: charge.chargePaise });
        }
      }
    }

    // Exactly 100 distinct charges recorded despite 300 attempts
    expect(ledger.size).toBe(100);
    // Total charges = 100 * 4500 = 450,000 paise (₹4,500)
    const total = balance(Array.from(ledger.values()));
    expect(total).toBe(450000);
  });

  // Launch Gate 3: Replaying the same events twice gives an identical ledger
  it("Gate 3: Replaying the same events twice gives an identical ledger", () => {
    interface Event {
      type: "delivery" | "skip_late";
      orderId: string;
      unitPricePaise: number;
    }

    const events: Event[] = [
      { type: "delivery", orderId: "ord_1", unitPricePaise: 9000 },
      { type: "delivery", orderId: "ord_2", unitPricePaise: 9500 },
      { type: "skip_late", orderId: "ord_3", unitPricePaise: 9000 },
      { type: "delivery", orderId: "ord_4", unitPricePaise: 9000 },
    ];

    const ledger = new Map<string, { amountPaise: number; type: string }>();

    function processEvent(e: Event) {
      if (e.type === "delivery") {
        const key = deliveryKey(e.orderId);
        if (!ledger.has(key)) {
          ledger.set(key, { amountPaise: e.unitPricePaise, type: "delivery" });
        }
      } else {
        const key = lateFeeKey(e.orderId);
        if (!ledger.has(key)) {
          const { chargePaise } = lateCharge("half", 1, e.unitPricePaise);
          ledger.set(key, { amountPaise: chargePaise, type: "late_fee" });
        }
      }
    }

    // First replay
    for (const e of events) processEvent(e);
    const balanceRun1 = balance(Array.from(ledger.values()));
    const snapshot1 = JSON.stringify(Array.from(ledger.entries()));

    // Second replay of all events
    for (const e of events) processEvent(e);
    const balanceRun2 = balance(Array.from(ledger.values()));
    const snapshot2 = JSON.stringify(Array.from(ledger.entries()));

    expect(balanceRun1).toBe(balanceRun2);
    expect(snapshot1).toBe(snapshot2);
  });
});
