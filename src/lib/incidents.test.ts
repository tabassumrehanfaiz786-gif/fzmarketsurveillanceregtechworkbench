import { describe, it, expect } from "vitest";
import { recordIncident, COOLDOWN_MS } from "./incidents";
import { MANGO_SCENARIO, oracleCollar } from "./killswitch";
describe("incident registry", () => {
  it("ignores calm signals", () => { expect(recordIncident([], { snifferScore: null, vpin: 0.2, branching: 0.3 }, 0)).toHaveLength(0); });
  it("records a Hawkes cascade at n >= 0.85", () => { const l = recordIncident([], { snifferScore: null, vpin: 0.2, branching: 0.9 }, 0); expect(l[0]?.suspicion).toBe("Disorderly cascade / momentum ignition"); });
  it("dedupes within cooldown then records again after", () => {
    const s = { snifferScore: null, vpin: 0.6, branching: 0.2 };
    let l = recordIncident([], s, 0); l = recordIncident(l, s, 1000); expect(l).toHaveLength(1);
    l = recordIncident(l, s, COOLDOWN_MS + 1); expect(l).toHaveLength(2);
  });
});
describe("Mango oracle collar", () => {
  it("passes normal market and halts the pump at 3.5%", () => {
    expect(oracleCollar(MANGO_SCENARIO[0]!)).toBeNull();
    expect(oracleCollar(MANGO_SCENARIO[2]!)).toMatch(/halt/);
  });
});
