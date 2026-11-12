// Pure VPIN (Volume-Synchronized Probability of Informed Trading) on a volume clock.
// Easley–López de Prado–O'Hara. Uses exchange-reported aggressor side for buy/sell split.

export type VpinRegime = "CALM" | "ELEVATED" | "TOXIC";
export interface VpinConfig { bucketVolume: number; windowBuckets: number }
export const DEFAULT_VPIN: VpinConfig = { bucketVolume: 5, windowBuckets: 50 };

export interface VpinTracker {
  cfg: VpinConfig;
  buy: number; // current bucket
  sell: number;
  imbalances: number[]; // completed buckets |Vb - Vs|
}

export function createVpinTracker(cfg: VpinConfig = DEFAULT_VPIN): VpinTracker {
  return { cfg, buy: 0, sell: 0, imbalances: [] };
}

/** Add a print; overflow spills into following buckets so each bucket holds exactly V. */
export function addTradeToVpin(t: VpinTracker, qty: number, side: "buy" | "sell") {
  let left = qty;
  const V = t.cfg.bucketVolume;
  while (left > 0) {
    const room = V - (t.buy + t.sell);
    const take = Math.min(room, left);
    if (side === "buy") t.buy += take; else t.sell += take;
    left -= take;
    if (t.buy + t.sell >= V - 1e-12) {
      t.imbalances.push(Math.abs(t.buy - t.sell));
      if (t.imbalances.length > t.cfg.windowBuckets) t.imbalances.shift();
      t.buy = 0; t.sell = 0;
    }
  }
}

export function vpinValue(t: VpinTracker): number | null {
  const n = t.imbalances.length;
  if (n < 5) return null;
  return t.imbalances.reduce((a, b) => a + b, 0) / (n * t.cfg.bucketVolume);
}

export function calculateVpinRegime(v: number): VpinRegime {
  if (v > 0.5) return "TOXIC";
  if (v >= 0.25) return "ELEVATED";
  return "CALM";
}
