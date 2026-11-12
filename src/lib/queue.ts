// Pure FIFO queue-priority fill model for a passive resting order. Simulation only.
export interface QueueOrder { side: "buy" | "sell"; price: number; qty: number; ahead: number; filled: number; placedAt: number; filledAt: number | null }
export function placeOrder(side: "buy" | "sell", price: number, qty: number, displayedAtLevel: number, t: number): QueueOrder {
  return { side, price, qty, ahead: Math.max(0, displayedAtLevel), filled: 0, placedAt: t, filledAt: null };
}
/** Feed a public print. Aggressive sells hit resting bids at/below; aggressive buys lift asks at/above. */
export function onPrint(o: QueueOrder, price: number, qty: number, aggressor: "buy" | "sell", t: number): QueueOrder {
  if (o.filled >= o.qty) return o;
  const hits = o.side === "buy" ? aggressor === "sell" && price <= o.price : aggressor === "buy" && price >= o.price;
  if (!hits) return o;
  const through = o.side === "buy" ? price < o.price : price > o.price; // traded through: whole queue gone
  let left = qty; let ahead = o.ahead;
  if (through) ahead = 0; else { const eat = Math.min(ahead, left); ahead -= eat; left -= eat; }
  const fill = through ? o.qty - o.filled : Math.min(left, o.qty - o.filled);
  const filled = o.filled + fill;
  return { ...o, ahead, filled, filledAt: filled >= o.qty ? t : o.filledAt };
}
/** Cancellations ahead of us shrink the queue (assumed uniform). */
export function onCancel(o: QueueOrder, qty: number): QueueOrder { return { ...o, ahead: Math.max(0, o.ahead - qty) }; }
