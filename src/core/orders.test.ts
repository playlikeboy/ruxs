import { describe, it, expect } from "bun:test";
import { resolveDay } from "./orders";

describe("order resolution rules", () => {
  const standardSub = {
    qty: 1,
    days: ["mon", "tue", "wed", "thu", "fri"],
  };

  it("returns subscription default when no change was submitted", () => {
    const result = resolveDay(standardSub, null, "wed");
    expect(result).toEqual({ status: "confirmed", qty: 1 });
  });

  it("returns skipped when the weekday is not in the subscription", () => {
    const result = resolveDay(standardSub, null, "sun");
    expect(result).toEqual({ status: "skipped", qty: 0 });
  });

  it("applies skip changes", () => {
    const result = resolveDay(
      standardSub,
      { kind: "skip", qty: 0 },
      "wed"
    );
    expect(result).toEqual({ status: "skipped", qty: 0 });
  });

  it("applies extra meal additions", () => {
    const result = resolveDay(
      standardSub,
      { kind: "extra", qty: 2 },
      "wed"
    );
    expect(result).toEqual({ status: "confirmed", qty: 3 });
  });

  it("applies explicit quantity overrides", () => {
    const resultPositive = resolveDay(
      standardSub,
      { kind: "qty", qty: 5 },
      "wed"
    );
    expect(resultPositive).toEqual({ status: "confirmed", qty: 5 });

    const resultZero = resolveDay(
      standardSub,
      { kind: "qty", qty: 0 },
      "wed"
    );
    expect(resultZero).toEqual({ status: "skipped", qty: 0 });
  });

  it("applies extra meal additions even on unscheduled days", () => {
    const result = resolveDay(
      standardSub,
      { kind: "extra", qty: 2 },
      "sun"
    );
    expect(result).toEqual({ status: "confirmed", qty: 2 });
  });

  it("handles unknown change kinds gracefully", () => {
    const result = resolveDay(
      standardSub,
      { kind: "unknown" as any, qty: 0 },
      "wed"
    );
    expect(result).toEqual({ status: "skipped", qty: 0 });
  });
});


