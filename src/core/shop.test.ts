import { describe, it, expect } from "bun:test";
import {
  cartTotals,
  canTransition,
  nextVendorStep,
  formatOrderNumber,
  deliveredLedgerLines,
  isBothDelivered,
  getDeliveryConfirmationState,
} from "./shop";

describe("cart totals", () => {
  it("sums lines in integer paise and adds the delivery fee", () => {
    const t = cartTotals(
      [
        { unitPricePaise: 9000, qty: 2 },
        { unitPricePaise: 4000, qty: 1 },
      ],
      1500
    );
    expect(t).toEqual({ subtotalPaise: 22000, deliveryFeePaise: 1500, totalPaise: 23500, itemCount: 3 });
  });

  it("charges no delivery fee on an empty cart", () => {
    expect(cartTotals([], 1500).totalPaise).toBe(0);
  });

  it("rejects floats and bad quantities", () => {
    expect(() => cartTotals([{ unitPricePaise: 90.5, qty: 1 }], 0)).toThrow();
    expect(() => cartTotals([{ unitPricePaise: 9000, qty: 0 }], 0)).toThrow();
    expect(() => cartTotals([{ unitPricePaise: 9000, qty: 21 }], 0)).toThrow();
    expect(() => cartTotals([{ unitPricePaise: 9000, qty: 1.5 }], 0)).toThrow();
  });
});

describe("order status transitions", () => {
  it("lets a consumer cancel only before the store accepts, and confirm delivery once active", () => {
    expect(canTransition("placed", "cancelled", "consumer")).toBe(true);
    expect(canTransition("accepted", "cancelled", "consumer")).toBe(false);
    expect(canTransition("placed", "delivered", "consumer")).toBe(false);
    expect(canTransition("accepted", "delivered", "consumer")).toBe(true);
    expect(canTransition("out_for_delivery", "delivered", "consumer")).toBe(true);
  });

  it("checks two-sided delivery confirmation logic", () => {
    expect(isBothDelivered(null, null)).toBe(false);
    expect(isBothDelivered(new Date(), null)).toBe(false);
    expect(isBothDelivered(null, new Date())).toBe(false);
    expect(isBothDelivered(new Date(), new Date())).toBe(true);

    expect(getDeliveryConfirmationState(null, null)).toBe("pending");
    expect(getDeliveryConfirmationState(new Date(), null)).toBe("awaiting_consumer");
    expect(getDeliveryConfirmationState(null, new Date())).toBe("awaiting_vendor");
    expect(getDeliveryConfirmationState(new Date(), new Date())).toBe("confirmed");
  });

  it("walks a vendor forward through the flow", () => {
    expect(canTransition("placed", "accepted", "vendor")).toBe(true);
    expect(canTransition("placed", "rejected", "vendor")).toBe(true);
    expect(canTransition("accepted", "out_for_delivery", "vendor")).toBe(true);
    expect(canTransition("out_for_delivery", "delivered", "vendor")).toBe(true);
    expect(canTransition("placed", "delivered", "vendor")).toBe(false);
    expect(nextVendorStep("placed")).toBe("accepted");
    expect(nextVendorStep("delivered")).toBeNull();
  });

  it("keeps unpaid online orders out of the kitchen flow", () => {
    expect(canTransition("awaiting_payment", "accepted", "vendor")).toBe(false);
    expect(canTransition("awaiting_payment", "cancelled", "consumer")).toBe(true);
    expect(canTransition("awaiting_payment", "placed", "admin")).toBe(true);
  });

  it("never reopens a closed order, even for admins", () => {
    expect(canTransition("delivered", "placed", "admin")).toBe(false);
    expect(canTransition("cancelled", "accepted", "admin")).toBe(false);
    expect(canTransition("placed", "delivered", "admin")).toBe(true);
  });
});

describe("order numbers and ledger lines", () => {
  it("formats readable order numbers", () => {
    expect(formatOrderNumber("2026-10-15", "4k7q")).toBe("RX-1015-4K7Q");
  });

  it("nets cash-on-delivery to zero and leaves monthly-bill orders owing", () => {
    const cod = deliveredLedgerLines(23500, "cod");
    expect(cod.reduce((a, l) => a + l.amountPaise, 0)).toBe(0);
    expect(deliveredLedgerLines(23500, "monthly_bill")).toEqual([{ type: "delivery", amountPaise: 23500 }]);
    expect(deliveredLedgerLines(23500, "online").reduce((a, l) => a + l.amountPaise, 0)).toBe(0);
  });
});
