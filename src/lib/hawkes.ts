// Pure univariate Hawkes point-process engine with exponential kernel.
// λ(t) = μ + Σ α·exp(-β·(t - t_i)); branching ratio n = α/β.
// Results are statistical estimates and never drive strategy decisions.

export type HawkesRegime = "ORGANIC" | "EXCITED" | "CASCADE_HAZARD";
export type HawkesState = { intensity: number; branchingRatio: number; regime: HawkesRegime; confidence: number };
export type HawkesConfig = { beta: number; windowSec: number; binSec: number; maxEvents: number };

export const DEFAULT_HAWKES: HawkesConfig = { beta: 0.5, windowSec: 120, binSec: 1, maxEvents: 5000 };
export const REGIME_LABEL: Record<HawkesRegime, string> = {
  ORGANIC: "ORGANIC POISSON",
  EXCITED: "EXCITED FLOW",
  CASCADE_HAZARD: "CRITICAL CASCADE HAZARD",
};

export function classify(n: number): HawkesRegime {
  if (n >= 0.85) return "CASCADE_HAZARD";
  if (n >= 0.4) return "EXCITED";
  return "ORGANIC";
}

/** λ(t) for given parameters over event times (seconds). */
export function intensityAt(t: number, events: number[], mu: number, alpha: number, beta: number): number {
  let s = 0;
  for (const ti of events) if (ti <= t) s += Math.exp(-beta * (t - ti));
  return mu + alpha * s;
}

/**
 * Branching ratio via bin-count dispersion (Hardiman–Bouchaud): for a stationary
 * Hawkes process with bins much longer than 1/β, Var/Mean ≈ 1/(1-n)².
 */
export function estimateBranching(events: number[], start: number, end: number, binSec: number): number {
  const bins = Math.floor((end - start) / binSec);
  if (bins < 5 || events.length < 5) return 0;
  const counts = new Array<number>(bins).fill(0);
  for (const t of events) {
    const i = Math.floor((t - start) / binSec);
    if (i >= 0 && i < bins) counts[i] = (counts[i] ?? 0) + 1;
  }
  const mean = counts.reduce((a, b) => a + b, 0) / bins;
  if (mean <= 0) return 0;
  const v = counts.reduce((a, c) => a + (c - mean) ** 2, 0) / (bins - 1);
  if (v <= mean) return 0;
  return Math.min(0.99, Math.max(0, 1 - Math.sqrt(mean / v)));
}

/** Evaluate the Hawkes state at time `now` (seconds) over the rolling window. */
export function hawkesState(events: number[], now: number, cfg: HawkesConfig = DEFAULT_HAWKES): HawkesState {
  const start = now - cfg.windowSec;
  const win = events.filter((t) => t >= start && t <= now);
  const n = estimateBranching(win, start, now, cfg.binSec);
  const rate = win.length / cfg.windowSec;
  const mu = rate * (1 - n);
  const alpha = n * cfg.beta;
  const intensity = intensityAt(now, win, mu, alpha, cfg.beta);
  return { intensity, branchingRatio: n, regime: classify(n), confidence: Math.min(1, win.length / 200) };
}

/** Bounded rolling buffer of arrival times (seconds), sorted ascending. */
export function pushEvent(events: number[], t: number, cfg: HawkesConfig = DEFAULT_HAWKES): number[] {
  events.push(t);
  const cutoff = t - cfg.windowSec;
  let drop = 0;
  while (drop < events.length && (events[drop] ?? Infinity) < cutoff) drop++;
  if (drop) events.splice(0, drop);
  if (events.length > cfg.maxEvents) events.splice(0, events.length - cfg.maxEvents);
  return events;
}

/**
 * Rough-volatility proxy: Hurst exponent from scaling of increment variance,
 * Var(x_{t+k} - x_t) ∝ k^{2H}. H < 0.5 indicates rough (anti-persistent) volatility.
 */
export function hurstExponent(prices: number[], lags: number[] = [1, 2, 4, 8, 16]): number | null {
  const x = prices.filter((p) => p > 0).map(Math.log);
  const pts: [number, number][] = [];
  for (const k of lags) {
    if (x.length <= k + 2) continue;
    const d: number[] = [];
    for (let i = k; i < x.length; i++) d.push(x[i]! - x[i - k]!);
    const m = d.reduce((a, b) => a + b, 0) / d.length;
    const v = d.reduce((a, b) => a + (b - m) ** 2, 0) / d.length;
    if (v > 0) pts.push([Math.log(k), Math.log(v)]);
  }
  if (pts.length < 3) return null;
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const slope = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  return Math.min(1, Math.max(0, slope / 2));
}
