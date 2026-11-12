import { describe, expect, it } from "bun:test";
import {
  ageBandMatches,
  ageRangeLabel,
  canCustomerCancel,
  canTransitionStoreOrder,
  discountPercent,
  formatStoreOrderNumber,
  isCodAllowed,
  maxOrderQty,
  mergeBagLines,
  nextAdminStatuses,
  paymentStatusAfterCancel,
  restocksOnTransition,
  stockLabel,
  storeAgeBand,
  storeCartTotals,
  storeOrderPeriod,
  storeServiceability,
  storeSlug,
  STORE_MAX_LINE_QTY,
} from "./store";

const fees = { deliveryFeePaise: 4000, freeDeliveryAbovePaise: 49900 };

describe("storeCartTotals", () => {
  it("adds the delivery fee below the free threshold", () => {
    const t = storeCartTotals([{ unitPricePaise: 19900, qty: 2 }], fees);
    expect(t).toEqual({ subtotalPaise: 39800, deliveryFeePaise: 4000, totalPaise: 43800, itemCount: 2, freeDeliveryGapPaise: 10100 });
  });

  it("is free at or above the threshold", () => {
    const t = storeCartTotals([{ unitPricePaise: 49900, qty: 1 }], fees);
    expect(t.deliveryFeePaise).toBe(0);
    expect(t.totalPaise).toBe(49900);
    expect(t.freeDeliveryGapPaise).toBeNull();
  });

  it("never free when threshold is null", () => {
    const t = storeCartTotals([{ unitPricePaise: 999900, qty: 1 }], { deliveryFeePaise: 4000, freeDeliveryAbovePaise: null });
    expect(t.deliveryFeePaise).toBe(4000);
    expect(t.freeDeliveryGapPaise).toBeNull();
  });

  it("charges nothing for an empty bag", () => {
    expect(storeCartTotals([], fees).totalPaise).toBe(0);
  });

  it("rejects fractional money", () => {
    expect(() => storeCartTotals([{ unitPricePaise: 10.5, qty: 1 }], fees)).toThrow();
    expect(() => storeCartTotals([{ unitPricePaise: 100, qty: 0 }], fees)).toThrow();
  });
});

describe("canTransitionStoreOrder", () => {
  it("system settles or expires unpaid orders only", () => {
    expect(canTransitionStoreOrder("awaiting_payment", "placed", "system")).toBe(true);
    expect(canTransitionStoreOrder("awaiting_payment", "cancelled", "system")).toBe(true);
    expect(canTransitionStoreOrder("placed", "cancelled", "system")).toBe(false);
  });

  it("customer cancels only before packing", () => {
    expect(canTransitionStoreOrder("placed", "cancelled", "customer")).toBe(true);
    expect(canTransitionStoreOrder("awaiting_payment", "cancelled", "customer")).toBe(true);
    expect(canTransitionStoreOrder("packed", "cancelled", "customer")).toBe(false);
    expect(canTransitionStoreOrder("placed", "packed", "customer")).toBe(false);
    expect(canCustomerCancel("out_for_delivery")).toBe(false);
  });

  it("admin follows the fulfilment flow", () => {
    expect(nextAdminStatuses("placed")).toEqual(["packed", "cancelled"]);
    expect(nextAdminStatuses("packed")).toEqual(["out_for_delivery", "cancelled"]);
    expect(nextAdminStatuses("out_for_delivery")).toEqual(["delivered", "returned"]);
    expect(nextAdminStatuses("delivered")).toEqual(["returned"]);
    expect(nextAdminStatuses("cancelled")).toEqual([]);
    expect(nextAdminStatuses("returned")).toEqual([]);
    expect(canTransitionStoreOrder("awaiting_payment", "placed", "admin")).toBe(false);
    expect(canTransitionStoreOrder("placed", "delivered", "admin")).toBe(false);
  });
});

describe("payment and stock side effects", () => {
  it("paid cancellations become refund_due", () => {
    expect(paymentStatusAfterCancel("paid")).toBe("refund_due");
    expect(paymentStatusAfterCancel("unpaid")).toBe("unpaid");
  });
  it("only cancellation restocks", () => {
    expect(restocksOnTransition("cancelled")).toBe(true);
    expect(restocksOnTransition("returned")).toBe(false);
  });
});

describe("isCodAllowed", () => {
  it("respects the toggle and the cap", () => {
    expect(isCodAllowed(1000, { codEnabled: false, codMaxPaise: null })).toBe(false);
    expect(isCodAllowed(300000, { codEnabled: true, codMaxPaise: 300000 })).toBe(true);
    expect(isCodAllowed(300001, { codEnabled: true, codMaxPaise: 300000 })).toBe(false);
    expect(isCodAllowed(99999999, { codEnabled: true, codMaxPaise: null })).toBe(true);
  });
});

describe("order numbers", () => {
  it("formats RS-YYMM-#### in IST", () => {
    // 2026-10-31 20:00 UTC is already 1 Nov in IST.
    const d = new Date("2026-10-31T20:00:00Z");
    expect(storeOrderPeriod(d)).toBe("2611");
    expect(formatStoreOrderNumber(7, d)).toBe("RS-2611-0007");
    expect(formatStoreOrderNumber(12345, d)).toBe("RS-2611-12345");
  });
  it("rejects bad sequences", () => {
    expect(() => formatStoreOrderNumber(0)).toThrow();
    expect(() => formatStoreOrderNumber(1.5)).toThrow();
  });
});

describe("discountPercent", () => {
  it("rounds down and ignores missing or lower MRP", () => {
    expect(discountPercent(74900, 99900)).toBe(25);
    expect(discountPercent(66600, 99900)).toBe(33);
    expect(discountPercent(99900, 99900)).toBe(0);
    expect(discountPercent(99900, null)).toBe(0);
    expect(discountPercent(99900, 50000)).toBe(0);
  });
});

describe("stock", () => {
  it("labels out, low and in stock", () => {
    expect(stockLabel(0, 5)).toEqual({ kind: "out", label: "Out of stock" });
    expect(stockLabel(3, 5)).toEqual({ kind: "low", label: "Only 3 left" });
    expect(stockLabel(6, 5)).toEqual({ kind: "in", label: "In stock" });
  });
  it("caps order qty by stock and line limit", () => {
    expect(maxOrderQty(0)).toBe(0);
    expect(maxOrderQty(3)).toBe(3);
    expect(maxOrderQty(500)).toBe(STORE_MAX_LINE_QTY);
  });
});

describe("ages", () => {
  it("matches overlapping bands", () => {
    const band = storeAgeBand("5-8")!;
    expect(ageBandMatches({ ageMin: 6, ageMax: 10 }, band)).toBe(true);
    expect(ageBandMatches({ ageMin: 9, ageMax: 14 }, band)).toBe(false);
    expect(ageBandMatches({ ageMin: 3, ageMax: null }, storeAgeBand("12+")!)).toBe(true);
    expect(ageBandMatches({ ageMin: 0, ageMax: 2 }, storeAgeBand("12+")!)).toBe(false);
    expect(storeAgeBand("nope")).toBeNull();
  });
  it("labels ranges", () => {
    expect(ageRangeLabel(3, 8)).toBe("3–8 yrs");
    expect(ageRangeLabel(8, null)).toBe("8+ yrs");
    expect(ageRangeLabel(0, null)).toBe("All ages");
  });
});

describe("storeServiceability", () => {
  const ranchi = {
    serviceability: "geofence" as const,
    serviceLatitude: 23.3441,
    serviceLongitude: 85.3096,
    serviceRadiusKm: 25,
    serviceCity: "Ranchi",
  };
  it("accepts addresses inside the geofence", () => {
    expect(storeServiceability({ latitude: 23.3751, longitude: 85.3242 }, ranchi).ok).toBe(true);
  });
  it("rejects far addresses and missing locations", () => {
    const far = storeServiceability({ latitude: 22.8046, longitude: 86.2029 }, ranchi); // Jamshedpur
    expect(far).toMatchObject({ ok: false, reason: "out_of_area", message: "Delivering in Ranchi for now" });
    expect(storeServiceability(null, ranchi)).toMatchObject({ ok: false, reason: "no_location" });
  });
  it("ships anywhere in india mode", () => {
    expect(storeServiceability(null, { ...ranchi, serviceability: "india" }).ok).toBe(true);
  });
});

describe("helpers", () => {
  it("slugs names", () => {
    expect(storeSlug("  Solar Robot Kit — 12 in 1! ")).toBe("solar-robot-kit-12-in-1");
    expect(storeSlug("Café Paints")).toBe("cafe-paints");
  });
  it("merges bag lines and caps qty", () => {
    expect(
      mergeBagLines([
        { productId: "a", qty: 6 },
        { productId: "b", qty: 1 },
        { productId: "a", qty: 8 },
        { productId: "c", qty: 0 },
      ])
    ).toEqual([
      { productId: "a", qty: STORE_MAX_LINE_QTY },
      { productId: "b", qty: 1 },
    ]);
  });
});
