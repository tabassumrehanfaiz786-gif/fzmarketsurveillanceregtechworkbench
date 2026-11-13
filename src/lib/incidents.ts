// Pure market-abuse incident registry (UK MAR Art 16(2) surveillance log). Estimates only; never identifies participants.
import { classify, type Signals, type Suspicion } from "./stor";
export interface Incident { id: string; t: number; suspicion: Exclude<Suspicion, "None">; score: number; reasons: string[]; signals: Signals }
export const COOLDOWN_MS = 60_000;
export const MAX_INCIDENTS = 100;

/** Append an incident when a threshold is breached, deduplicating the same typology within the cooldown. */
export function recordIncident(log: Incident[], s: Signals, t: number): Incident[] {
  const c = classify(s);
  if (c.suspicion === "None") return log;
  const last = log.find((i) => i.suspicion === c.suspicion);
  if (last && t - last.t < COOLDOWN_MS) return log;
  const inc: Incident = { id: `INC-${t}-${c.suspicion.slice(0, 3)}`, t, suspicion: c.suspicion, score: c.score, reasons: c.reasons, signals: s };
  return [inc, ...log].slice(0, MAX_INCIDENTS);
}
