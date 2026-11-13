// Pure: turn a batch of public Coinbase REST prints into surveillance signals.
import { estimateBranching } from "./hawkes";
import { addTradeToVpin, createVpinTracker, vpinValue } from "./vpin";
import type { Signals } from "./stor";

export interface RestPrint { time: number; qty: number; side: "buy" | "sell" }

/** Coinbase REST `side` is the maker side; aggressor is the opposite. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseRestTrade(d: any): RestPrint { return { time: Date.parse(d.time), qty: +d.size, side: d.side === "sell" ? "buy" : "sell" }; }

export function scanSignals(prints: RestPrint[]): Signals {
  const sorted = [...prints].sort((a, b) => a.time - b.time);
  const v = createVpinTracker();
  for (const p of sorted) addTradeToVpin(v, p.qty, p.side);
  const ts = sorted.map((p) => p.time / 1000);
  const start = ts[0] ?? 0, end = ts[ts.length - 1] ?? 0;
  const branching = ts.length >= 20 ? estimateBranching(ts, start, end, 1) : null;
  return { snifferScore: null, vpin: vpinValue(v), branching };
}
