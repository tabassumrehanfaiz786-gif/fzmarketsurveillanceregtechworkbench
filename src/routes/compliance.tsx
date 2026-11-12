import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "UK/EU Regulatory Mapping — FZ Quant Terminal" },
      { name: "description", content: "How each surveillance module maps to UK MAR, MiFID II RTS 6/27/28 and MiFIR transparency rules." },
      { property: "og:title", content: "UK/EU Regulatory Mapping — FZ Quant Terminal" },
      { property: "og:description", content: "Statutory frameworks behind the Hawkes, VPIN, iceberg, sniffer, OTC and lead-lag modules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompliancePage,
});

const ROWS: { module: string; to: string; measures: string; law: string; question: string }[] = [
  { module: "Hawkes Cascade Radar", to: "/hawkes", measures: "Self-excitation branching ratio n; endogenous vs exogenous flow.", law: "MiFID II Art 17 & RTS 6 (algorithmic trading controls, kill switches, circuit breakers); UK MAR Art 12.", question: "At what level of endogenous feedback should an investment firm's pre-trade controls halt an algorithm?" },
  { module: "VPIN Toxicity Gauge", to: "/", measures: "Volume-clock order-flow imbalance (informed trading probability).", law: "UK MAR Art 14 & 16 (insider dealing, suspicious transaction reporting — STORs).", question: "Can persistent order-flow toxicity serve as a surveillance trigger for suspected informed trading?" },
  { module: "Iceberg Absorption Visualizer", to: "/icebergs", measures: "Executed vs displayed volume; refill behaviour at fixed levels.", law: "MiFIR Arts 4 & 9 (pre-trade transparency waivers, order management facility); UK MAR Art 12(1)(a).", question: "When does hidden liquidity stop being a permitted waiver and start giving a misleading signal of supply or demand?" },
  { module: "5-Vector Hidden Order Sniffer", to: "/sniffer", measures: "Clip size, timing jitter, participation, persistence, price walk.", law: "UK MAR Annex I indicators; ESMA guidance on layering, spoofing and pinging; FCA MAR 1.6.", question: "Which statistical footprints of order slicing are evidence of manipulation versus legitimate execution?" },
  { module: "OTC & Stealth Desk", to: "/desk", measures: "Sweep vs RFQ vs iceberg slicer cost; large-in-scale thresholds.", law: "MiFID II Art 27 & COBS 11.2A (best execution); Systematic Internaliser regime; RTS 27/28 reporting.", question: "Is off-venue block execution consistent with best-execution duties when lit markets are thin?" },
  { module: "Cross-Venue Lead-Lag Radar", to: "/leadlag", measures: "Basis, lag correlation, fee-aware paper arbitrage across venues.", law: "MiFID II Art 48 (venue resilience, latency); UK MAR cross-market manipulation (Art 12(1)(b)).", question: "How should regulators treat latency arbitrage across fragmented spot and derivative venues?" },
  { module: "Execution Slippage Model", to: "/", measures: "Half spread + adverse-selection slippage scaled by branching ratio.", law: "MiFID II Art 27 (price, costs, speed, likelihood of execution); PRIIPs cost disclosure.", question: "How should hidden execution costs be disclosed to clients in stressed markets?" },
  { module: "Prudential context", to: "/", measures: "Cryptoasset exposures observed on live BTC markets.", law: "Basel Committee cryptoasset standard (SCO60); FSMA 2023 cryptoasset regime.", question: "What capital treatment fits unbacked cryptoassets with cascade-prone liquidity?" },
];

function CompliancePage() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-mono text-lg font-semibold">UK/EU Regulatory Mapping</h1>
          <Button asChild size="sm" variant="outline"><Link to="/">Back to terminal</Link></Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This terminal is an empirical research lab: each module measures a live market behaviour that a specific UK or EU rule tries to govern. All results are estimates from public data; nothing here identifies participants or sends real orders.
        </p>
        <div className="grid gap-3">
          {ROWS.map((r) => (
            <section key={r.module} className="rounded-md border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-mono text-sm font-semibold text-primary">{r.module}</h2>
                <Link to={r.to} className="text-xs text-muted-foreground underline">Open</Link>
              </div>
              <p className="mt-1 text-xs"><b>Measures:</b> {r.measures}</p>
              <p className="mt-1 text-xs"><b>Legal framework:</b> {r.law}</p>
              <p className="mt-1 text-xs italic text-muted-foreground">Research question: {r.question}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
