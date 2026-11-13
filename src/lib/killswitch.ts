// Pure MiFID II Art 17 / RTS 6 style pre-trade controls. Display/test bench only — never sends or blocks real orders.
export interface KillLimits { maxOrderQty: number; maxOrdersPerMin: number; priceCollarPct: number; hawkesTrip: number; vpinTrip: number }
export const DEFAULT_LIMITS: KillLimits = { maxOrderQty: 5, maxOrdersPerMin: 30, priceCollarPct: 1, hawkesTrip: 0.85, vpinTrip: 0.5 };
export interface TestOrder { t: number; qty: number; price: number }
export interface Market { ref: number; branching: number | null; vpin: number | null }
export type Verdict = { ok: true } | { ok: false; rule: string; detail: string };

/** Kill switch is armed when either systemic tripwire is breached. */
export function killSwitchTripped(m: Market, L: KillLimits = DEFAULT_LIMITS): string | null {
  if (m.branching != null && m.branching >= L.hawkesTrip) return `Hawkes n=${m.branching.toFixed(2)} ≥ ${L.hawkesTrip}`;
  if (m.vpin != null && m.vpin > L.vpinTrip) return `VPIN ${m.vpin.toFixed(2)} > ${L.vpinTrip}`;
  return null;
}

/** recent = timestamps (ms) of previously accepted orders. */
export function checkOrder(o: TestOrder, m: Market, recent: number[], L: KillLimits = DEFAULT_LIMITS): Verdict {
  const k = killSwitchTripped(m, L);
  if (k) return { ok: false, rule: "KILL SWITCH (RTS 6 Art 12)", detail: k };
  if (o.qty > L.maxOrderQty) return { ok: false, rule: "Max order size (RTS 6 Art 15)", detail: `${o.qty} > ${L.maxOrderQty}` };
  const dev = (Math.abs(o.price - m.ref) / m.ref) * 100;
  if (dev > L.priceCollarPct) return { ok: false, rule: "Price collar (RTS 6 Art 15)", detail: `${dev.toFixed(2)}% from ref` };
  const inMin = recent.filter((t) => o.t - t < 60_000).length;
  if (inMin >= L.maxOrdersPerMin) return { ok: false, rule: "Message throttle (RTS 6 Art 15)", detail: `${inMin} orders/min` };
  return { ok: true };
}

/** Mango Markets (Oct 2022) style oracle-manipulation case study: oracle mark diverges from deep spot reference. */
export interface MangoStep { label: string; oracle: number; spot: number }
export const MANGO_SCENARIO: MangoStep[] = [
  { label: "Normal market", oracle: 0.038, spot: 0.038 },
  { label: "Attacker buys thin perp/spot", oracle: 0.06, spot: 0.039 },
  { label: "Oracle pumped", oracle: 0.54, spot: 0.041 },
  { label: "Borrow against inflated collateral", oracle: 0.91, spot: 0.042 },
];
/** RTS 6-style collar on oracle vs spot divergence; returns halt reason or null. */
export function oracleCollar(step: MangoStep, collarPct = 3.5): string | null {
  const dev = (Math.abs(step.oracle - step.spot) / step.spot) * 100;
  return dev > collarPct ? `Oracle deviates ${dev.toFixed(1)}% from spot (> ${collarPct}%) — halt` : null;
}
