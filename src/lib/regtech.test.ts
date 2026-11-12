import { describe, expect, it } from "vitest";
import { checkOrder, killSwitchTripped } from "./killswitch";
import { buildStor, classify } from "./stor";
import { onPrint, placeOrder } from "./queue";

const calm = { ref: 100000, branching: 0.2, vpin: 0.2 };
describe("kill switch", () => {
  it("trips at Hawkes n >= 0.85", () => expect(killSwitchTripped({ ...calm, branching: 0.85 })).not.toBeNull());
  it("trips at VPIN > 0.50 but not at 0.50", () => {
    expect(killSwitchTripped({ ...calm, vpin: 0.51 })).not.toBeNull();
    expect(killSwitchTripped({ ...calm, vpin: 0.5 })).toBeNull();
  });
  it("rejects orders over 5 BTC", () => expect(checkOrder({ t: 0, qty: 6, price: 100000 }, calm, []).ok).toBe(false));
  it("rejects prices beyond 1% collar", () => expect(checkOrder({ t: 0, qty: 1, price: 101500 }, calm, []).ok).toBe(false));
  it("throttles the 31st order in a minute", () => {
    const recent = Array.from({ length: 30 }, (_, i) => i * 1000);
    expect(checkOrder({ t: 31000, qty: 1, price: 100000 }, calm, recent).ok).toBe(false);
    expect(checkOrder({ t: 31000, qty: 1, price: 100000 }, calm, recent.slice(1)).ok).toBe(true);
  });
});
describe("STOR", () => {
  it("no suspicion when calm", () => expect(classify({ snifferScore: 0.3, vpin: 0.2, branching: 0.3 }).suspicion).toBe("None"));
  it("flags informed flow on VPIN", () => expect(buildStor({ snifferScore: null, vpin: 0.7, branching: 0.2 }, new Date(0)).suspicion).toBe("Insider dealing (informed flow proxy)"));
});
describe("FIFO queue", () => {
  it("fills only after queue ahead is consumed", () => {
    let o = placeOrder("buy", 100, 1, 3, 0);
    o = onPrint(o, 100, 2, "sell", 1); expect(o.filled).toBe(0); expect(o.ahead).toBe(1);
    o = onPrint(o, 100, 1.5, "sell", 2); expect(o.filled).toBe(0.5);
    o = onPrint(o, 99, 0.1, "sell", 3); expect(o.filled).toBe(1); expect(o.filledAt).toBe(3);
  });
  it("ignores buy prints for a resting bid", () => expect(onPrint(placeOrder("buy", 100, 1, 0, 0), 100, 5, "buy", 1).filled).toBe(0));
});
