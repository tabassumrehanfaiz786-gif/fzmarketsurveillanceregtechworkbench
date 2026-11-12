// Pure FCA STOR (UK MAR Art 16, SUP 15.10) draft builder from surveillance signals. Estimates only; never identifies participants.
export type Suspicion = "Layering/Spoofing" | "Insider dealing (informed flow proxy)" | "Disorderly cascade / momentum ignition" | "None";
export interface Signals { snifferScore: number | null; vpin: number | null; branching: number | null }
export interface StorDraft { ref: string; createdAt: string; venue: string; instrument: string; suspicion: Suspicion; score: number; reasons: string[]; narrative: string }

export function classify(s: Signals): { suspicion: Suspicion; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let best: Suspicion = "None"; let score = 0;
  if (s.snifferScore != null && s.snifferScore >= 0.6) { reasons.push(`Order-slicing footprint ${(s.snifferScore * 100).toFixed(0)}%`); if (s.snifferScore > score) { score = s.snifferScore; best = "Layering/Spoofing"; } }
  if (s.vpin != null && s.vpin > 0.5) { reasons.push(`VPIN toxicity ${s.vpin.toFixed(2)} > 0.50`); if (s.vpin > score) { score = s.vpin; best = "Insider dealing (informed flow proxy)"; } }
  if (s.branching != null && s.branching >= 0.85) { reasons.push(`Hawkes branching n=${s.branching.toFixed(2)} ≥ 0.85`); if (s.branching > score) { score = s.branching; best = "Disorderly cascade / momentum ignition"; } }
  return { suspicion: best, score, reasons };
}

export function buildStor(s: Signals, now: Date, venue = "Coinbase", instrument = "BTC-USD"): StorDraft {
  const c = classify(s);
  const ref = `STOR-${now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
  const narrative = c.suspicion === "None"
    ? "No surveillance threshold breached; no reasonable suspicion formed. No STOR should be filed."
    : `Automated surveillance on public ${venue} ${instrument} prints flagged ${c.suspicion.toLowerCase()} at ${now.toISOString()}. Indicators: ${c.reasons.join("; ")}. These are statistical estimates; a compliance officer must review before forming reasonable suspicion under UK MAR Art 16(2).`;
  return { ref, createdAt: now.toISOString(), venue, instrument, ...c, narrative };
}
