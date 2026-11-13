import { describe, expect, it } from "bun:test";
import {
  adjustStockSchema,
  parseAgeBand,
  parseOrderFilter,
  parsePage,
  parseProductFilter,
  parseStoreSort,
  bulkForwardStoreOrdersSchema,
  bulkStockSchema,
  parseReturnFilter,
  parseReviewFilter,
  placeStoreOrderSchema,
  quoteBagSchema,
  shippingAddressSchema,
  storeCategorySchema,
  storeCouponSchema,
  storePartnerSchema,
  storeProductSchema,
  storeReturnRequestSchema,
  storeReviewSchema,
  storeSettingsSchema,
  storeShippingZoneSchema,
  updateStoreReturnSchema,
} from "./schemas";

const product = {
  name: "Solar robot kit",
  categoryId: "robotics-electronics",
  sku: "rx-solar-12",
  pricePaise: 89900,
};

describe("storeProductSchema", () => {
  it("fills defaults and normalises the SKU", () => {
    const p = storeProductSchema.parse(product);
    expect(p.sku).toBe("RX-SOLAR-12");
    expect(p.images).toEqual([]);
    expect(p.isActive).toBe(true);
    expect(p.initialStock).toBe(0);
  });

  it("rejects fractional paise and MRP below price", () => {
    expect(storeProductSchema.safeParse({ ...product, pricePaise: 899.5 }).success).toBe(false);
    expect(storeProductSchema.safeParse({ ...product, mrpPaise: 50000 }).success).toBe(false);
    expect(storeProductSchema.safeParse({ ...product, mrpPaise: 99900 }).success).toBe(true);
  });

  it("rejects bad ages, too many images and unsafe links", () => {
    expect(storeProductSchema.safeParse({ ...product, ageMin: 8, ageMax: 5 }).success).toBe(false);
    expect(storeProductSchema.safeParse({ ...product, images: Array(7).fill("/a.jpg") }).success).toBe(false);
    expect(storeProductSchema.safeParse({ ...product, images: ["javascript:alert(1)"] }).success).toBe(false);
    expect(storeProductSchema.safeParse({ ...product, images: ["//evil.com/a.png"] }).success).toBe(false);
    expect(storeProductSchema.safeParse({ ...product, images: ["https://cdn.ruxs.in/a.png"] }).success).toBe(true);
  });

  it("dedupes skills and drops blanks", () => {
    expect(storeProductSchema.parse({ ...product, skills: ["STEM", "STEM", " ", "Motor"] }).skills).toEqual(["STEM", "Motor"]);
  });
});

describe("placeStoreOrderSchema", () => {
  const shipping = { name: "Test Parent", phone: "9876543210", line1: "Flat 1, Test Society", city: "Ranchi", state: "Jharkhand", pincode: "834001" };
  const ok = { clientKey: crypto.randomUUID(), items: [{ productId: "p1", qty: 2 }], paymentMode: "cod", shipping };
  it("accepts a valid order", () => {
    expect(placeStoreOrderSchema.safeParse(ok).success).toBe(true);
  });
  it("rejects empty bags, qty over 10 and unknown payment modes", () => {
    expect(placeStoreOrderSchema.safeParse({ ...ok, items: [] }).success).toBe(false);
    expect(placeStoreOrderSchema.safeParse({ ...ok, items: [{ productId: "p1", qty: 11 }] }).success).toBe(false);
    expect(placeStoreOrderSchema.safeParse({ ...ok, paymentMode: "monthly_bill" }).success).toBe(false);
    expect(placeStoreOrderSchema.safeParse({ ...ok, clientKey: "x" }).success).toBe(false);
  });
});

describe("admin schemas", () => {
  it("adjustStock rejects zero and order reasons", () => {
    expect(adjustStockSchema.safeParse({ productId: "p", delta: 0, reason: "restock" }).success).toBe(false);
    expect(adjustStockSchema.safeParse({ productId: "p", delta: 5, reason: "order" }).success).toBe(false);
    expect(adjustStockSchema.safeParse({ productId: "p", delta: -2, reason: "adjust" }).success).toBe(true);
  });

  it("category ids are slugs and icons are lucide names", () => {
    expect(storeCategorySchema.safeParse({ id: "Robots!", name: "Robots" }).success).toBe(false);
    expect(storeCategorySchema.safeParse({ id: "robots", name: "Robots", icon: "<svg>" }).success).toBe(false);
    expect(storeCategorySchema.parse({ id: "robots", name: "Robots" }).icon).toBe("Package");
  });

  it("settings default to pan-India and still allow one-city mode", () => {
    const s = {
      isOpen: true,
      codEnabled: true,
      deliveryFeePaise: 4000,
      minOrderPaise: 0,
      serviceLatitude: 23.3441,
      serviceLongitude: 85.3096,
      serviceRadiusKm: 25,
      dispatchDays: 1,
    };
    expect(storeSettingsSchema.parse(s).serviceability).toBe("india");
    expect(storeSettingsSchema.safeParse({ ...s, serviceability: "geofence" }).success).toBe(true);
    expect(storeSettingsSchema.safeParse({ ...s, serviceability: "world" }).success).toBe(false);
    expect(storeSettingsSchema.safeParse({ ...s, deliveryFeePaise: 40.5 }).success).toBe(false);
    // Fields an older form omits stay undefined, so saving can't reset them.
    expect(storeSettingsSchema.parse(s).autoForward).toBeUndefined();
    expect(storeSettingsSchema.parse(s).returnWindowDays).toBeUndefined();
    expect(storeSettingsSchema.safeParse({ ...s, defaultEtaMinDays: 5, defaultEtaMaxDays: 3 }).success).toBe(false);
    expect(storeSettingsSchema.safeParse({ ...s, defaultEtaMinDays: 3, defaultEtaMaxDays: 7, returnWindowDays: 10, autoForward: true }).success).toBe(true);
  });
});

describe("shipping address", () => {
  const address = { name: "Test Parent", phone: "98765 43210", line1: "Flat 1, Test Society", city: "Ranchi", state: "jharkhand", pincode: "834001" };

  it("normalises phone and state", () => {
    const a = shippingAddressSchema.parse(address);
    expect(a.phone).toBe("+919876543210");
    expect(a.state).toBe("Jharkhand");
    expect(a.line2).toBe("");
    expect(a.landmark).toBe("");
  });

  it("rejects bad PIN codes, states and phones", () => {
    for (const pincode of ["034001", "83400", "8340012", "83400x", ""]) expect(shippingAddressSchema.safeParse({ ...address, pincode }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, state: "Narnia" }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, phone: "12345" }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, line1: "x" }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, city: "" }).success).toBe(false);
  });

  it("the order needs the full address", () => {
    const order = { clientKey: crypto.randomUUID(), items: [{ productId: "p1", qty: 1 }], paymentMode: "cod" };
    const missing = placeStoreOrderSchema.safeParse(order);
    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0]?.message).toBe("Add your full delivery address");
    expect(placeStoreOrderSchema.safeParse({ ...order, shipping: { ...address, pincode: undefined } }).error?.issues[0]?.message).toBe("Enter a valid 6-digit PIN code");
    const parsed = placeStoreOrderSchema.parse({ ...order, shipping: address, couponCode: " diwali10 ", expectedTotalPaise: 43800 });
    expect(parsed.couponCode).toBe("DIWALI10");
    expect(placeStoreOrderSchema.parse({ ...order, shipping: address, couponCode: "  " }).couponCode).toBeUndefined();
    expect(placeStoreOrderSchema.safeParse({ ...order, shipping: address, expectedTotalPaise: 438.5 }).success).toBe(false);
  });

  it("the quote takes a half-typed PIN", () => {
    expect(quoteBagSchema.safeParse({ items: [], pincode: "83" }).success).toBe(true);
    expect(quoteBagSchema.parse({ items: [], couponCode: "save 50" }).couponCode).toBe("SAVE50");
  });
});

describe("v2 admin schemas", () => {
  it("zones need a PIN prefix or a state, and sane estimates", () => {
    const z = { name: "Ranchi", pinPrefixes: ["834", "834", " 835 "], feePaise: 4000, etaMinDays: 1, etaMaxDays: 2 };
    expect(storeShippingZoneSchema.parse(z).pinPrefixes).toEqual(["834", "835"]);
    expect(storeShippingZoneSchema.parse({ ...z, pinPrefixes: [], states: ["jharkhand", "Jharkhand"] }).states).toEqual(["Jharkhand"]);
    expect(storeShippingZoneSchema.safeParse({ ...z, pinPrefixes: [] }).success).toBe(false);
    expect(storeShippingZoneSchema.safeParse({ ...z, pinPrefixes: ["0834"] }).success).toBe(false);
    expect(storeShippingZoneSchema.safeParse({ ...z, states: ["Narnia"] }).success).toBe(false);
    expect(storeShippingZoneSchema.safeParse({ ...z, etaMinDays: 5, etaMaxDays: 2 }).success).toBe(false);
    expect(storeShippingZoneSchema.safeParse({ ...z, feePaise: 40.5 }).success).toBe(false);
  });

  it("partners need a real email", () => {
    const p = { name: "Test Logistics", email: " Ops@Example.com " };
    expect(storePartnerSchema.parse(p).email).toBe("ops@example.com");
    expect(storePartnerSchema.safeParse({ ...p, email: "nope" }).success).toBe(false);
    expect(storePartnerSchema.safeParse({ ...p, coveragePinPrefixes: ["abc"] }).success).toBe(false);
    expect(bulkForwardStoreOrdersSchema.safeParse({ orderIds: [] }).success).toBe(false);
    expect(bulkForwardStoreOrdersSchema.safeParse({ orderIds: ["o1"] }).success).toBe(true);
  });

  it("coupons: upper-case codes, percent capped at 100%, dates in order", () => {
    const c = { code: " diwali10 ", kind: "percent", value: 1000 };
    const parsed = storeCouponSchema.parse(c);
    expect(parsed.code).toBe("DIWALI10");
    expect(parsed.startsAt).toBeNull();
    expect(storeCouponSchema.safeParse({ ...c, value: 10001 }).success).toBe(false);
    expect(storeCouponSchema.safeParse({ ...c, kind: "flat", value: 50000 }).success).toBe(true);
    expect(storeCouponSchema.safeParse({ ...c, value: 10.5 }).success).toBe(false);
    expect(storeCouponSchema.safeParse({ ...c, code: "a b!" }).success).toBe(false);
    expect(storeCouponSchema.safeParse({ ...c, startsAt: "2026-12-01", endsAt: "2026-11-01" }).success).toBe(false);
    expect(storeCouponSchema.parse({ ...c, startsAt: "2026-11-01T00:00:00+05:30", endsAt: "" }).startsAt).toBeInstanceOf(Date);
    expect(storeCouponSchema.safeParse({ ...c, startsAt: "soon" }).success).toBe(false);
  });

  it("reviews are 1 to 5 stars; returns need a reason", () => {
    expect(storeReviewSchema.safeParse({ productId: "p", rating: 0 }).success).toBe(false);
    expect(storeReviewSchema.safeParse({ productId: "p", rating: 6 }).success).toBe(false);
    expect(storeReviewSchema.safeParse({ productId: "p", rating: 4.5 }).success).toBe(false);
    expect(storeReviewSchema.parse({ productId: "p", rating: 5 }).body).toBe("");
    expect(storeReturnRequestSchema.safeParse({ orderId: "o", reason: "no" }).success).toBe(false);
    expect(updateStoreReturnSchema.parse({ returnId: "r", to: "received" }).restock).toBe(true);
    expect(updateStoreReturnSchema.safeParse({ returnId: "r", to: "refunded" }).success).toBe(false);
  });

  it("bulk stock needs rows or CSV", () => {
    expect(bulkStockSchema.safeParse({ mode: "set" }).success).toBe(false);
    expect(bulkStockSchema.parse({ rows: [{ sku: "rs-1", qty: 4 }] })).toMatchObject({ mode: "set", rows: [{ sku: "RS-1", qty: 4 }] });
    expect(bulkStockSchema.safeParse({ csv: "sku,stock\nRS-1,4" }).success).toBe(true);
    expect(bulkStockSchema.safeParse({ rows: [{ sku: "RS-1", qty: 1.5 }] }).success).toBe(false);
  });

  it("new filters parse safely", () => {
    expect(parseOrderFilter("to_forward")).toBe("to_forward");
    expect(parseReviewFilter(undefined)).toBe("pending");
    expect(parseReviewFilter("all")).toBe("all");
    expect(parseReturnFilter("nope")).toBe("requested");
    expect(parseReturnFilter("received")).toBe("received");
  });
});

describe("search param parsers", () => {
  it("fall back to safe defaults", () => {
    expect(parseAgeBand("5-8")).toBe("5-8");
    expect(parseAgeBand("99")).toBeNull();
    expect(parseStoreSort(["price_asc"])).toBe("price_asc");
    expect(parseStoreSort("drop table")).toBe("featured");
    expect(parseProductFilter("low")).toBe("low");
    expect(parseOrderFilter(undefined)).toBe("open");
    expect(parseOrderFilter("packed")).toBe("packed");
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("4")).toBe(4);
  });
});
