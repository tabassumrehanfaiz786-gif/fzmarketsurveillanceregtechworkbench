import { describe, expect, it } from "vitest";
import { scanSignals } from "./background-scan";
describe("background scan", () => {
  it("one-sided flow exceeds the 0.50 VPIN threshold", () => {
    const prints = Array.from({ length: 300 }, (_, i) => ({ time: i * 100, qty: 1, side: "buy" as const }));
    expect(scanSignals(prints).vpin!).toBeGreaterThan(0.5);
  });
  it("too few prints gives no branching estimate", () => {
    expect(scanSignals([{ time: 0, qty: 1, side: "buy" }]).branching).toBeNull();
  });
});
