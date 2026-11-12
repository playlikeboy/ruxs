import { describe, expect, it } from "bun:test";
import {
  adjustStockSchema,
  parseAgeBand,
  parseOrderFilter,
  parsePage,
  parseProductFilter,
  parseStoreSort,
  placeStoreOrderSchema,
  storeCategorySchema,
  storeProductSchema,
  storeSettingsSchema,
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
  const ok = { clientKey: crypto.randomUUID(), items: [{ productId: "p1", qty: 2 }], paymentMode: "cod" };
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

  it("settings keep india shipping off for now", () => {
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
    expect(storeSettingsSchema.safeParse(s).success).toBe(true);
    expect(storeSettingsSchema.safeParse({ ...s, serviceability: "india" }).success).toBe(false);
    expect(storeSettingsSchema.safeParse({ ...s, deliveryFeePaise: 40.5 }).success).toBe(false);
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
