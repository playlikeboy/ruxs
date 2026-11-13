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
  cameBackInStock,
  canForwardStoreOrder,
  canRequestReturn,
  canTransitionReturn,
  checkStoreCoupon,
  codAmountToCollect,
  couponDiscountPaise,
  etaLabel,
  formatShipAddress,
  INDIAN_STATES,
  isValidPinPrefix,
  isValidPincode,
  nextReturnStatuses,
  normalizeCouponCode,
  normalizeIndianMobile,
  normalizeIndianState,
  partnerCoverageScore,
  rankFulfilmentPartners,
  ratingAverage,
  resolveShippingZone,
  returnDeadline,
  type ShippingZoneRule,
  type StoreCouponRule,
} from "./store";

const fees = { deliveryFeePaise: 4000, freeDeliveryAbovePaise: 49900 };

describe("storeCartTotals", () => {
  it("adds the delivery fee below the free threshold", () => {
    const t = storeCartTotals([{ unitPricePaise: 19900, qty: 2 }], fees);
    expect(t).toEqual({ subtotalPaise: 39800, deliveryFeePaise: 4000, discountPaise: 0, totalPaise: 43800, itemCount: 2, freeDeliveryGapPaise: 10100 });
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

describe("storeCartTotals with a discount", () => {
  it("takes the discount off the total, not the delivery fee", () => {
    const t = storeCartTotals([{ unitPricePaise: 19900, qty: 2 }], fees, 5000);
    expect(t).toEqual({ subtotalPaise: 39800, deliveryFeePaise: 4000, discountPaise: 5000, totalPaise: 38800, itemCount: 2, freeDeliveryGapPaise: 10100 });
  });

  it("judges free delivery on the subtotal before the discount", () => {
    const t = storeCartTotals([{ unitPricePaise: 49900, qty: 1 }], fees, 10000);
    expect(t.deliveryFeePaise).toBe(0);
    expect(t.totalPaise).toBe(39900);
  });

  it("never discounts more than the subtotal", () => {
    const t = storeCartTotals([{ unitPricePaise: 10000, qty: 1 }], fees, 99999);
    expect(t.discountPaise).toBe(10000);
    expect(t.totalPaise).toBe(4000);
  });

  it("rejects fractional or negative discounts", () => {
    expect(() => storeCartTotals([{ unitPricePaise: 10000, qty: 1 }], fees, 10.5)).toThrow();
    expect(() => storeCartTotals([{ unitPricePaise: 10000, qty: 1 }], fees, -1)).toThrow();
  });
});

describe("storeServiceability in india mode", () => {
  const settings = { serviceability: "india" as const, serviceLatitude: 23.3441, serviceLongitude: 85.3096, serviceRadiusKm: 25, serviceCity: "Ranchi" };
  it("ships anywhere without a location", () => {
    expect(storeServiceability(null, settings)).toEqual({ ok: true, distanceKm: null });
    expect(storeServiceability({ latitude: 8.5, longitude: 76.9 }, settings).ok).toBe(true);
  });
});

describe("PIN codes, states and phones", () => {
  it("accepts six digits not starting with 0", () => {
    expect(isValidPincode("834001")).toBe(true);
    expect(isValidPincode("110001")).toBe(true);
    for (const bad of ["034001", "83400", "8340011", "83400a", " 834001", "", null, undefined]) expect(isValidPincode(bad)).toBe(false);
  });

  it("validates PIN prefixes", () => {
    expect(isValidPinPrefix("8")).toBe(true);
    expect(isValidPinPrefix("834001")).toBe(true);
    for (const bad of ["", "0", "08", "8340011", "83a"]) expect(isValidPinPrefix(bad)).toBe(false);
  });

  it("normalises states loosely", () => {
    expect(INDIAN_STATES.length).toBe(36);
    expect(normalizeIndianState("jharkhand")).toBe("Jharkhand");
    expect(normalizeIndianState(" Jammu & Kashmir ")).toBe("Jammu and Kashmir");
    expect(normalizeIndianState("TAMIL NADU")).toBe("Tamil Nadu");
    expect(normalizeIndianState("Atlantis")).toBeNull();
    expect(normalizeIndianState(null)).toBeNull();
  });

  it("normalises Indian mobiles to +91", () => {
    expect(normalizeIndianMobile("9876543210")).toBe("+919876543210");
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("+919876543210");
    expect(normalizeIndianMobile("09876543210")).toBe("+919876543210");
    expect(normalizeIndianMobile("919876543210")).toBe("+919876543210");
    for (const bad of ["12345", "5876543210", "98765432101", "98765abcde", "", null]) expect(normalizeIndianMobile(bad)).toBeNull();
  });

  it("formats a one-line address", () => {
    expect(formatShipAddress({ line1: "Flat 1, Test Society", line2: "", landmark: "Near park", city: "Ranchi", state: "Jharkhand", pincode: "834001" })).toBe(
      "Flat 1, Test Society, Near park, Ranchi, Jharkhand 834001"
    );
  });
});

describe("resolveShippingZone", () => {
  const defaults = { deliveryFeePaise: 4000, freeDeliveryAbovePaise: 49900, defaultEtaMinDays: 3, defaultEtaMaxDays: 7 };
  const zone = (z: Partial<ShippingZoneRule> & { id: string }): ShippingZoneRule => ({
    name: z.id,
    pinPrefixes: [],
    states: [],
    feePaise: 5000,
    freeAbovePaise: null,
    etaMinDays: 2,
    etaMaxDays: 4,
    codAllowed: true,
    isActive: true,
    sort: 0,
    ...z,
  });
  const zones = [
    zone({ id: "east", pinPrefixes: ["8"], feePaise: 6000 }),
    zone({ id: "ranchi", pinPrefixes: ["834"], feePaise: 3000, etaMinDays: 1, etaMaxDays: 2 }),
    zone({ id: "ranchi-core", pinPrefixes: ["834001"], feePaise: 0 }),
    zone({ id: "jharkhand", states: ["Jharkhand"], feePaise: 4500 }),
    zone({ id: "islands", states: ["Lakshadweep"], feePaise: 15000, codAllowed: false, etaMinDays: 7, etaMaxDays: 14 }),
    zone({ id: "off", pinPrefixes: ["8340"], feePaise: 1, isActive: false }),
  ];

  it("picks the longest matching PIN prefix", () => {
    expect(resolveShippingZone({ pincode: "834001", state: "Jharkhand" }, zones, defaults)).toMatchObject({ zoneId: "ranchi-core", matchedBy: "pin", feePaise: 0 });
    expect(resolveShippingZone({ pincode: "834002", state: "Jharkhand" }, zones, defaults)).toMatchObject({ zoneId: "ranchi", matchedBy: "pin", feePaise: 3000, etaMinDays: 1 });
    expect(resolveShippingZone({ pincode: "800001", state: "Bihar" }, zones, defaults)).toMatchObject({ zoneId: "east", matchedBy: "pin" });
  });

  it("ignores inactive zones", () => {
    expect(resolveShippingZone({ pincode: "834099" }, zones, defaults).zoneId).toBe("ranchi");
  });

  it("a PIN match beats a state match", () => {
    expect(resolveShippingZone({ pincode: "825301", state: "Jharkhand" }, zones, defaults).zoneId).toBe("east");
  });

  it("falls back to the state, then the defaults", () => {
    expect(resolveShippingZone({ pincode: "682555", state: "lakshadweep" }, zones, defaults)).toMatchObject({ zoneId: "islands", matchedBy: "state", codAllowed: false });
    expect(resolveShippingZone({ pincode: null, state: "Jharkhand" }, zones, defaults)).toMatchObject({ zoneId: "jharkhand", matchedBy: "state" });
    expect(resolveShippingZone({ pincode: "110001", state: "Delhi" }, zones, defaults)).toEqual({
      zoneId: null,
      zoneName: null,
      matchedBy: "default",
      feePaise: 4000,
      freeAbovePaise: 49900,
      etaMinDays: 3,
      etaMaxDays: 7,
      codAllowed: true,
    });
  });

  it("breaks equal-length ties by sort", () => {
    const tied = [zone({ id: "b", pinPrefixes: ["11"], sort: 2 }), zone({ id: "a", pinPrefixes: ["11"], sort: 1 })];
    expect(resolveShippingZone({ pincode: "110001" }, tied, defaults).zoneId).toBe("a");
  });

  it("an invalid PIN never matches a prefix", () => {
    expect(resolveShippingZone({ pincode: "8340", state: null }, zones, defaults).matchedBy).toBe("default");
  });

  it("labels estimates", () => {
    expect(etaLabel(2, 4)).toBe("2–4 days");
    expect(etaLabel(3, 3)).toBe("3 days");
    expect(etaLabel(1, 1)).toBe("1 day");
    expect(etaLabel(0, 0)).toBe("Today");
  });
});

describe("coupons", () => {
  const now = new Date("2026-11-13T10:00:00Z");
  const base: StoreCouponRule = {
    kind: "percent",
    value: 1000,
    minOrderPaise: 0,
    maxDiscountPaise: null,
    usageLimit: null,
    perUserLimit: null,
    startsAt: null,
    endsAt: null,
    isActive: true,
  };
  const ctx = { subtotalPaise: 99900, now, totalUses: 0, userUses: 0 };

  it("normalises codes", () => {
    expect(normalizeCouponCode("  diwali 10 ")).toBe("DIWALI10");
  });

  it("percent rounds down in whole paise", () => {
    expect(couponDiscountPaise(base, 99900)).toBe(9990);
    expect(couponDiscountPaise({ ...base, value: 1250 }, 33333)).toBe(4166);
    expect(Number.isInteger(couponDiscountPaise({ ...base, value: 333 }, 100001))).toBe(true);
  });

  it("percent respects the cap", () => {
    expect(couponDiscountPaise({ ...base, value: 5000, maxDiscountPaise: 20000 }, 99900)).toBe(20000);
  });

  it("flat is capped at the subtotal", () => {
    expect(couponDiscountPaise({ kind: "flat", value: 10000, maxDiscountPaise: null }, 99900)).toBe(10000);
    expect(couponDiscountPaise({ kind: "flat", value: 10000, maxDiscountPaise: null }, 4000)).toBe(4000);
    expect(couponDiscountPaise({ kind: "percent", value: 10000, maxDiscountPaise: null }, 4000)).toBe(4000);
  });

  it("gives nothing for bad input", () => {
    expect(couponDiscountPaise(base, 0)).toBe(0);
    expect(couponDiscountPaise({ ...base, value: 0 }, 1000)).toBe(0);
    expect(couponDiscountPaise({ ...base, value: 12.5 }, 1000)).toBe(0);
  });

  it("applies when everything is in order", () => {
    expect(checkStoreCoupon(base, ctx)).toEqual({ ok: true, discountPaise: 9990 });
  });

  it("refuses for each rule", () => {
    const reason = (c: StoreCouponRule, over: Partial<typeof ctx> = {}) => {
      const r = checkStoreCoupon(c, { ...ctx, ...over });
      return r.ok ? "ok" : r.reason;
    };
    expect(reason({ ...base, isActive: false })).toBe("inactive");
    expect(reason({ ...base, startsAt: new Date("2026-12-01T00:00:00Z") })).toBe("not_started");
    expect(reason({ ...base, endsAt: new Date("2026-11-13T10:00:00Z") })).toBe("expired");
    expect(reason({ ...base, endsAt: new Date("2026-11-13T10:00:01Z") })).toBe("ok");
    expect(reason({ ...base, usageLimit: 5 }, { totalUses: 5 })).toBe("usage_limit");
    expect(reason({ ...base, usageLimit: 5 }, { totalUses: 4 })).toBe("ok");
    expect(reason({ ...base, perUserLimit: 1 }, { userUses: 1 })).toBe("per_user_limit");
    expect(reason({ ...base, minOrderPaise: 100000 })).toBe("min_order");
    expect(reason({ ...base, minOrderPaise: 99900 })).toBe("ok");
  });

  it("says how much to add for the minimum order", () => {
    const r = checkStoreCoupon({ ...base, minOrderPaise: 149900 }, ctx);
    expect(r.ok ? "" : r.message).toContain("₹1499");
  });
});

describe("reviews and returns", () => {
  it("averages to one decimal", () => {
    expect(ratingAverage(13, 3)).toBe(4.3);
    expect(ratingAverage(5, 1)).toBe(5);
    expect(ratingAverage(0, 0)).toBeNull();
  });

  const deliveredAt = new Date("2026-11-01T06:00:00Z");

  it("allows a return inside the window only", () => {
    expect(returnDeadline(deliveredAt, 7).toISOString()).toBe("2026-11-08T06:00:00.000Z");
    expect(canRequestReturn({ status: "delivered", deliveredAt }, 7, new Date("2026-11-08T06:00:00Z")).ok).toBe(true);
    const late = canRequestReturn({ status: "delivered", deliveredAt }, 7, new Date("2026-11-08T06:00:01Z"));
    expect(late.ok ? "" : late.reason).toBe("window_closed");
  });

  it("needs a delivered order and returns switched on", () => {
    const notYet = canRequestReturn({ status: "out_for_delivery", deliveredAt: null }, 7);
    expect(notYet.ok ? "" : notYet.reason).toBe("not_delivered");
    const off = canRequestReturn({ status: "delivered", deliveredAt }, 0, deliveredAt);
    expect(off.ok ? "" : off.reason).toBe("returns_off");
  });

  it("walks the return statuses forward only", () => {
    expect(nextReturnStatuses("requested")).toEqual(["approved", "rejected"]);
    expect(nextReturnStatuses("approved")).toEqual(["rejected", "received"]);
    expect(nextReturnStatuses("received")).toEqual(["refunded"]);
    expect(nextReturnStatuses("refunded")).toEqual([]);
    expect(nextReturnStatuses("rejected")).toEqual([]);
    expect(canTransitionReturn("requested", "received")).toBe(false);
    expect(canTransitionReturn("requested", "refunded")).toBe(false);
  });

  it("spots a product coming back in stock", () => {
    expect(cameBackInStock(5, 5)).toBe(true);
    expect(cameBackInStock(6, 5)).toBe(false);
    expect(cameBackInStock(0, -3)).toBe(false);
  });
});

describe("fulfilment partners", () => {
  const partner = (p: { id: string; states?: string[]; pins?: string[]; isActive?: boolean; openOrders?: number }) => ({
    id: p.id,
    name: p.id,
    coverageStates: p.states ?? [],
    coveragePinPrefixes: p.pins ?? [],
    isActive: p.isActive ?? true,
    openOrders: p.openOrders ?? 0,
  });
  const dest = { pincode: "834001", state: "Jharkhand" };

  it("scores PIN above state above anywhere", () => {
    expect(partnerCoverageScore(partner({ id: "p", pins: ["834"] }), dest)).toEqual({ score: 1003, matchedBy: "pin" });
    expect(partnerCoverageScore(partner({ id: "p", states: ["jharkhand"] }), dest)).toEqual({ score: 500, matchedBy: "state" });
    expect(partnerCoverageScore(partner({ id: "p" }), dest)).toEqual({ score: 1, matchedBy: "anywhere" });
    expect(partnerCoverageScore(partner({ id: "p", states: ["Bihar"], pins: ["80"] }), dest)).toEqual({ score: 0, matchedBy: null });
  });

  it("ranks the best match first and skips inactive or non-covering partners", () => {
    const ranked = rankFulfilmentPartners(
      [
        partner({ id: "anywhere" }),
        partner({ id: "state", states: ["Jharkhand"] }),
        partner({ id: "pin3", pins: ["834"] }),
        partner({ id: "pin6", pins: ["834001"] }),
        partner({ id: "off", pins: ["834001"], isActive: false }),
        partner({ id: "bihar", states: ["Bihar"] }),
      ],
      dest
    );
    expect(ranked.map((r) => r.partner.id)).toEqual(["pin6", "pin3", "state", "anywhere"]);
  });

  it("breaks ties by lighter workload, then name", () => {
    const ranked = rankFulfilmentPartners(
      [partner({ id: "busy", pins: ["834"], openOrders: 9 }), partner({ id: "zed", pins: ["834"], openOrders: 2 }), partner({ id: "abe", pins: ["834"], openOrders: 2 })],
      dest
    );
    expect(ranked.map((r) => r.partner.id)).toEqual(["abe", "zed", "busy"]);
  });

  it("forwards only orders waiting to be packed or shipped", () => {
    expect(canForwardStoreOrder("placed")).toBe(true);
    expect(canForwardStoreOrder("packed")).toBe(true);
    for (const s of ["awaiting_payment", "out_for_delivery", "delivered", "cancelled", "returned"] as const) expect(canForwardStoreOrder(s)).toBe(false);
  });

  it("collects cash only on unpaid COD orders", () => {
    expect(codAmountToCollect({ paymentMode: "cod", paymentStatus: "unpaid", totalPaise: 43800 })).toBe(43800);
    expect(codAmountToCollect({ paymentMode: "cod", paymentStatus: "paid", totalPaise: 43800 })).toBe(0);
    expect(codAmountToCollect({ paymentMode: "online", paymentStatus: "paid", totalPaise: 43800 })).toBe(0);
  });
});
