import { describe, expect, it } from "vitest";
import { classify, hawkesState, hurstExponent, intensityAt, pushEvent } from "./hawkes";

function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

describe("hawkes", () => {
  it("baseline Poisson arrivals stay organic (n < 0.4)", () => {
    const r = rng(7); const ev: number[] = []; let t = 0;
    while (t < 120) { t += -Math.log(1 - r()) / 5; if (t < 120) ev.push(t); }
    const s = hawkesState(ev, 120);
    expect(s.branchingRatio).toBeLessThan(0.4);
    expect(s.regime).toBe("ORGANIC");
  });

  it("rapid burst clusters trigger cascade hazard (n >= 0.85)", () => {
    const ev: number[] = [];
    for (let c = 0; c < 120; c += 10) for (let i = 0; i < 60; i++) ev.push(c + 0.2 + i * 0.01);
    const s = hawkesState(ev, 120);
    expect(s.branchingRatio).toBeGreaterThanOrEqual(0.85);
    expect(s.regime).toBe("CASCADE_HAZARD");
  });

  it("intensity decays exponentially back to μ over quiet intervals", () => {
    const ev = [0, 0.1, 0.2];
    const l0 = intensityAt(0.2, ev, 1, 0.4, 0.5);
    const l2 = intensityAt(2.2, ev, 1, 0.4, 0.5);
    expect(l2 - 1).toBeCloseTo((l0 - 1) * Math.exp(-1), 6);
    expect(intensityAt(60, ev, 1, 0.4, 0.5)).toBeCloseTo(1, 6);
  });

  it("classifies regime thresholds", () => {
    expect(classify(0.39)).toBe("ORGANIC");
    expect(classify(0.4)).toBe("EXCITED");
    expect(classify(0.85)).toBe("CASCADE_HAZARD");
  });

  it("rolling buffer drops events older than the window", () => {
    const ev: number[] = [];
    pushEvent(ev, 0); pushEvent(ev, 100); pushEvent(ev, 200);
    expect(ev).toEqual([100, 200]);
  });

  it("Hurst ≈ 0.5 for a random walk", () => {
    const r = rng(3); const p = [100];
    for (let i = 0; i < 4000; i++) p.push(p[i] * Math.exp((r() - 0.5) * 0.002));
    expect(hurstExponent(p)!).toBeGreaterThan(0.4);
    expect(hurstExponent(p)!).toBeLessThan(0.6);
  });
});
