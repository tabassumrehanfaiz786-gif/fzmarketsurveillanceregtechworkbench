import { describe, it, expect } from "vitest";
import { createEngine, onCandleClose, managePrice, type Candle } from "./strategy";

const k = (o: number, h: number, l: number, c: number, buy = 5, vol = 10, time = 1): Candle => ({ time, open: o, high: h, low: l, close: c, volume: vol, buyVolume: buy });

describe("strategy rules", () => {
  it("sizes positions at $50,000", () => {
    const s = createEngine("touch");
    onCandleClose(s, k(70100, 70120, 69990, 70050));
    expect(s.position!.qty * s.position!.entry).toBeCloseTo(50_000);
  });
  it("caps the structure stop at $2,500", () => {
    const s = createEngine("sweep");
    onCandleClose(s, k(70200, 70300, 67000, 70100, 2));
    expect(s.position!.entry - s.position!.stop).toBe(2500);
  });
  it("moves stop to break-even after +$2,500 and runs to next 10k", () => {
    const s = createEngine("touch");
    onCandleClose(s, k(70100, 70120, 69990, 70000));
    managePrice(s, 72501, 2);
    expect(s.position!.stop).toBe(s.position!.entry);
    expect(s.position!.qty).toBeCloseTo(s.position!.initialQty / 2);
    expect(s.position!.target).toBe(80000);
  });
  it("short entered just above 80k targets 70k, not 80k", () => {
    const s = createEngine("touch");
    onCandleClose(s, k(79347, 80174, 79300, 80151.7));
    expect(s.position!.side).toBe("short");
    expect(s.position!.target).toBe(70000);
  });
  it("blocks re-entry until a clean $1,000 retest", () => {
    const s = createEngine("touch");
    onCandleClose(s, k(70100, 70120, 69990, 70000));
    managePrice(s, 67000, 2); // stopped
    onCandleClose(s, k(70100, 70120, 69990, 70000, 5, 10, 3));
    expect(s.position).toBeNull();
    onCandleClose(s, k(71000, 71100, 71000, 71100, 5, 10, 4));
    onCandleClose(s, k(70100, 70120, 69990, 70000, 5, 10, 5));
    expect(s.position).not.toBeNull();
  });
  it("reverses once after a full stop with stop beyond the 10k level", () => {
    const s = createEngine("touch");
    onCandleClose(s, k(70100, 70120, 69990, 70000));
    managePrice(s, 67000, 2);
    expect(s.position!.side).toBe("short");
    expect(s.position!.entry).toBe(67500);
    expect(s.position!.stop).toBe(70000);
    managePrice(s, 71000, 3);
    expect(s.position).toBeNull();
  });
});

describe("hawkes 10k mode", () => {
  const k = (time: number, o: number, h: number, l: number, c: number, v: number) => ({ time, open: o, high: h, low: l, close: c, volume: v, buyVolume: v / 2 });
  const warm = (e: ReturnType<typeof createEngine>, vol = 10) => { for (let i = 0; i < 20; i++) onCandleClose(e, k(i * 60, 85000, 85100, 84900, 85000, vol)); };

  it("fades a 10k touch when flow is organic (n < 0.4)", () => {
    const e = createEngine("hawkes"); warm(e);
    onCandleClose(e, k(2000, 90100, 90200, 90050, 90080, 10));
    expect(e.branching).toBeLessThan(0.4);
    expect(e.position?.side).toBe("long");
  });

  it("trades the breakout when the branching ratio reaches 0.85", () => {
    const e = createEngine("hawkes"); warm(e, 1);
    onCandleClose(e, k(2000, 90100, 90150, 89800, 89900, 400));
    expect(e.branching).toBeGreaterThanOrEqual(0.85);
    expect(e.position?.side).toBe("short");
  });

  it("skips the touch in the excited band (0.4 to 0.85)", () => {
    const e = createEngine("hawkes"); warm(e, 10);
    onCandleClose(e, k(1990, 85000, 85100, 84900, 85000, 30));
    onCandleClose(e, k(2000, 90100, 90200, 90050, 90080, 30));
    expect(e.branching).toBeGreaterThanOrEqual(0.4);
    expect(e.branching).toBeLessThan(0.85);
    expect(e.position).toBeNull();
  });
});

import { entrySlippage as _slip, DEFAULT_CONFIG as _cfg } from "./strategy";
describe("execution slippage", () => {
  it("pays only half spread when n <= 0.40", () => {
    expect(_slip(_cfg, 1000, 0.3)).toBe(0.5);
  });
  it("adds ATR-scaled adverse selection above n = 0.40", () => {
    expect(_slip(_cfg, 1000, 0.9)).toBeCloseTo(0.5 + 1000 * 0.5 * 0.05);
  });
});
