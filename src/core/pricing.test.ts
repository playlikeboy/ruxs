import { describe, expect, it } from "bun:test";
import { priceBreakup, GST_RATES_BPS } from "./pricing";

const none = { gstBps: 0, pricesIncludeGst: true, discountBps: 0, commissionBps: 0 };

describe("priceBreakup", () => {
  it("is the plain sum when the store adds nothing", () => {
    const b = priceBreakup(50000, 2000, none);
    expect(b).toMatchObject({ itemsPaise: 50000, discountPaise: 0, gstPaise: 0, deliveryFeePaise: 2000, totalPaise: 52000 });
  });

  it("takes the store discount off the listed price", () => {
    const b = priceBreakup(50000, 0, { ...none, discountBps: 1000 });
    expect(b.discountPaise).toBe(5000);
    expect(b.totalPaise).toBe(45000);
  });

  it("adds GST on top when prices exclude it", () => {
    const b = priceBreakup(45000, 2000, { ...none, gstBps: 1800, pricesIncludeGst: false });
    expect(b.taxablePaise).toBe(45000);
    expect(b.gstPaise).toBe(8100);
    expect(b.totalPaise).toBe(45000 + 8100 + 2000);
  });

  it("shows the GST already inside inclusive prices without changing the total", () => {
    const b = priceBreakup(11800, 0, { ...none, gstBps: 1800, pricesIncludeGst: true });
    expect(b.gstPaise).toBe(1800);
    expect(b.taxablePaise).toBe(10000);
    expect(b.totalPaise).toBe(11800);
  });

  it("applies discount before GST", () => {
    const b = priceBreakup(100000, 0, { ...none, discountBps: 1000, gstBps: 500, pricesIncludeGst: false });
    expect(b.discountPaise).toBe(10000);
    expect(b.gstPaise).toBe(4500);
    expect(b.totalPaise).toBe(94500);
  });

  it("reports the store-paid RUXs fee on goods without charging the household", () => {
    const b = priceBreakup(45000, 2000, { ...none, commissionBps: 500 });
    expect(b.commissionPaise).toBe(2250);
    expect(b.totalPaise).toBe(47000);
    expect(b.storeReceivesPaise).toBe(47000 - 2250);
  });

  it("keeps every amount in whole paise and the lines adding up", () => {
    for (const items of [1, 99, 12345, 99999]) {
      for (const rules of [
        { ...none, gstBps: 1200, pricesIncludeGst: false, discountBps: 333 },
        { ...none, gstBps: 2800, pricesIncludeGst: true, discountBps: 1500 },
      ]) {
        const b = priceBreakup(items, 700, rules);
        for (const v of Object.values(b)) expect(Number.isInteger(v)).toBe(true);
        const added = rules.pricesIncludeGst ? 0 : b.gstPaise;
        expect(b.totalPaise).toBe(b.itemsPaise - b.discountPaise + added + b.deliveryFeePaise);
        expect(b.taxablePaise + b.gstPaise).toBe(b.itemsPaise - b.discountPaise + added);
      }
    }
  });

  it("rejects out-of-range rules and money", () => {
    expect(() => priceBreakup(-1, 0, none)).toThrow();
    expect(() => priceBreakup(100, 0, { ...none, discountBps: 9500 })).toThrow();
    expect(() => priceBreakup(100, 0, { ...none, gstBps: 3000 })).toThrow();
    expect(() => priceBreakup(1.5, 0, none)).toThrow();
  });

  it("lists the GST slabs stores can pick", () => {
    expect(GST_RATES_BPS).toEqual([0, 500, 1200, 1800, 2800]);
  });
});
