import { describe, expect, it } from "bun:test";
import { toAdminOrderRow, toOrderDetail, toOrderSummary, toReturnView, type StoreOrderRow, type StoreReturnRow } from "./mappers";
import type { StoreOrderItemView } from "./types";

const SECRET = "ZZ-SECRET-AGENCY";

function order(over: Partial<StoreOrderRow> = {}): StoreOrderRow {
  const t = new Date("2026-11-01T06:00:00Z");
  return {
    id: "o1",
    orderNumber: "RS-2611-0001",
    userId: "u1",
    clientKey: "k1",
    status: "delivered",
    paymentMode: "cod",
    paymentStatus: "paid",
    subtotalPaise: 39800,
    deliveryFeePaise: 4000,
    discountPaise: 3000,
    totalPaise: 40800,
    couponId: "c1",
    couponCode: "DIWALI",
    customerName: "Test Parent",
    customerEmail: "parent@example.com",
    phone: "+919876543210",
    address: "Flat 1, Test Society, Ranchi, Jharkhand 834001",
    shipLine1: "Flat 1, Test Society",
    shipLine2: null,
    shipLandmark: null,
    shipCity: "Ranchi",
    shipState: "Jharkhand",
    shipPincode: "834001",
    zoneId: "z1",
    zoneName: `${SECRET} zone`,
    etaMinDays: 2,
    etaMaxDays: 4,
    latitude: null,
    longitude: null,
    notes: null,
    courier: `${SECRET} couriers`,
    trackingNumber: "TRK123",
    adminNote: `${SECRET} internal note`,
    cancelReason: null,
    partnerId: `${SECRET}-partner-id`,
    forwardedAt: t,
    forwardEmailedAt: t,
    partnerRef: `${SECRET}-ref`,
    partnerStatusNote: `${SECRET} picked up`,
    placedAt: t,
    packedAt: t,
    shippedAt: t,
    deliveredAt: t,
    cancelledAt: null,
    returnedAt: null,
    createdAt: t,
    updatedAt: t,
    ...over,
  };
}

const items: StoreOrderItemView[] = [
  { id: "i1", productId: "p1", productSlug: "kit", name: "Kit", image: null, unitPricePaise: 19900, qty: 2, lineTotalPaise: 39800, canReview: false, myRating: null },
];
const ctx = { dispatchDays: 1, returnWindowDays: 7, now: new Date("2026-11-03T06:00:00Z") };

describe("household order shapes keep fulfilment private", () => {
  it("never carry partner, zone, courier-name or internal-note data", () => {
    const detail = toOrderDetail(order(), items, ctx);
    const summary = toOrderSummary(order(), items);
    for (const shape of [detail, summary]) {
      const json = JSON.stringify(shape);
      expect(json).not.toContain(SECRET);
      for (const key of ["partner", "forwarded", "zone", "adminNote", "userId", "clientKey"]) {
        expect(Object.keys(shape).some((k) => k.toLowerCase().includes(key.toLowerCase()))).toBe(false);
      }
    }
    expect(detail.shippedBy).toBe("RUXs");
    expect(detail.courier).toBeNull();
    expect(detail.trackingNumber).toBe("TRK123");
  });

  it("the return view shows only the household-facing note", () => {
    const t = new Date("2026-11-02T06:00:00Z");
    const ret: StoreReturnRow = {
      id: "r1",
      orderId: "o1",
      userId: "u1",
      reason: "Missing parts",
      status: "rejected",
      adminNote: "The seal was opened",
      createdAt: t,
      updatedAt: t,
      approvedAt: null,
      rejectedAt: t,
      receivedAt: null,
      refundedAt: null,
    };
    expect(toReturnView(ret)).toEqual({ id: "r1", status: "rejected", statusLabel: "Return declined", reason: "Missing parts", note: "The seal was opened", createdAt: t, updatedAt: t });
    expect(Object.keys(toReturnView(ret))).not.toContain("userId");
  });
});

describe("toOrderDetail", () => {
  it("shows totals with the discount and the ship-to address", () => {
    const d = toOrderDetail(order(), items, ctx);
    expect(d.discountPaise).toBe(3000);
    expect(d.totalPaise).toBe(d.subtotalPaise + d.deliveryFeePaise - d.discountPaise);
    expect(d.shipTo).toEqual({ line1: "Flat 1, Test Society", line2: "", landmark: "", city: "Ranchi", state: "Jharkhand", pincode: "834001" });
    expect(d.etaLabel).toBe("2–4 days");
  });

  it("offers a return inside the window when none is open", () => {
    const d = toOrderDetail(order(), items, ctx);
    expect(d.canRequestReturn).toBe(true);
    expect(d.returnUntil?.toISOString()).toBe("2026-11-08T06:00:00.000Z");
    expect(toOrderDetail(order(), items, { ...ctx, now: new Date("2026-11-09T00:00:00Z") }).canRequestReturn).toBe(false);
    expect(toOrderDetail(order({ status: "out_for_delivery", deliveredAt: null }), items, ctx).canRequestReturn).toBe(false);
    expect(toOrderDetail(order(), items, { ...ctx, returnWindowDays: 0 }).canRequestReturn).toBe(false);
  });

  it("blocks a second request while one is live, allows it after a rejection", () => {
    const t = new Date("2026-11-02T06:00:00Z");
    const ret = (status: string): StoreReturnRow => ({ id: "r1", orderId: "o1", userId: "u1", reason: "Broken", status, adminNote: null, createdAt: t, updatedAt: t, approvedAt: null, rejectedAt: null, receivedAt: null, refundedAt: null });
    expect(toOrderDetail(order(), items, { ...ctx, returnRequest: ret("requested") }).canRequestReturn).toBe(false);
    expect(toOrderDetail(order(), items, { ...ctx, returnRequest: ret("rejected") }).canRequestReturn).toBe(true);
  });

  it("orders from before pan-India checkout have no structured address", () => {
    const d = toOrderDetail(order({ shipLine1: null, shipCity: null, shipState: null, shipPincode: null, etaMinDays: null, etaMaxDays: null }), items, ctx);
    expect(d.shipTo).toBeNull();
    expect(d.etaLabel).toBeNull();
  });
});

describe("toAdminOrderRow", () => {
  it("carries the partner for the seller portal", () => {
    expect(toAdminOrderRow(order(), 2, "Test Logistics")).toMatchObject({ partnerName: "Test Logistics", shipPincode: "834001", itemCount: 2 });
  });
});
