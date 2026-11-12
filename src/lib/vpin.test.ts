import { describe, expect, it } from "vitest";
import { addTradeToVpin, calculateVpinRegime, createVpinTracker, vpinValue } from "./vpin";

describe("vpin", () => {
  it("balanced flow is calm", () => {
    const t = createVpinTracker({ bucketVolume: 2, windowBuckets: 50 });
    for (let i = 0; i < 200; i++) addTradeToVpin(t, 0.5, i % 2 ? "buy" : "sell");
    expect(vpinValue(t)!).toBeLessThan(0.25);
    expect(calculateVpinRegime(vpinValue(t)!)).toBe("CALM");
  });
  it("one-sided flow is toxic", () => {
    const t = createVpinTracker({ bucketVolume: 2, windowBuckets: 50 });
    for (let i = 0; i < 200; i++) addTradeToVpin(t, 0.5, i % 10 ? "buy" : "sell");
    expect(calculateVpinRegime(vpinValue(t)!)).toBe("TOXIC");
  });
  it("large print spills across buckets", () => {
    const t = createVpinTracker({ bucketVolume: 1, windowBuckets: 50 });
    addTradeToVpin(t, 3.5, "buy");
    expect(t.imbalances).toEqual([1, 1, 1]);
    expect(t.buy).toBeCloseTo(0.5);
  });
  it("thresholds", () => {
    expect(calculateVpinRegime(0.24)).toBe("CALM");
    expect(calculateVpinRegime(0.25)).toBe("ELEVATED");
    expect(calculateVpinRegime(0.51)).toBe("TOXIC");
  });
});
