import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSurveillance } from "@/hooks/use-surveillance";
import { checkOrder, killSwitchTripped, MANGO_SCENARIO, oracleCollar, DEFAULT_LIMITS } from "@/lib/killswitch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/killswitch")({
  head: () => ({
    meta: [
      { title: "MiFID II RTS 6 Kill-Switch Bench — FZ Surveillance Workbench" },
      { name: "description", content: "Test pre-trade controls, price collars, throttles and kill switches under MiFID II Art 17 and RTS 6, plus a Mango Markets case study." },
      { property: "og:title", content: "MiFID II RTS 6 Kill-Switch Bench" },
      { property: "og:description", content: "Algorithmic trading controls tested against live market stress and an oracle-manipulation case study." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KillPage,
});

type Log = { t: number; text: string; ok: boolean };

function KillPage() {
  const s = useSurveillance();
  const [manual, setManual] = useState(false);
  const [qty, setQty] = useState(1);
  const [ref, setRef] = useState(100000);
  const [dev, setDev] = useState(0);
  const [accepted, setAccepted] = useState<number[]>([]);
  const [log, setLog] = useState<Log[]>([]);
  const [step, setStep] = useState(0);
  const market = { ref, branching: s.branching, vpin: s.vpin };
  const auto = killSwitchTripped(market);
  const add = (text: string, ok: boolean) => setLog((l) => [{ t: Date.now(), text, ok }, ...l].slice(0, 50));
  const send = () => {
    const t = Date.now();
    if (manual) return add("REJECT · Manual kill switch engaged (RTS 6 Art 12)", false);
    const v = checkOrder({ t, qty, price: ref * (1 + dev / 100) }, market, accepted);
    if (v.ok) { setAccepted((a) => [...a, t]); add(`ACCEPT · ${qty} BTC @ ${dev}% from ref`, true); }
    else add(`REJECT · ${v.rule} · ${v.detail}`, false);
  };
  const ms = MANGO_SCENARIO[step]; const halt = oracleCollar(ms);
  return (
    <main className="min-h-screen bg-background p-4 font-mono text-foreground">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">MiFID II RTS 6 Kill-Switch Bench</h1>
          <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to="/stor">STOR Generator</Link></Button><Button asChild size="sm" variant="outline"><Link to="/">Workbench</Link></Button></div>
        </div>
        <p className="text-sm text-muted-foreground">MiFID II Art 17 and RTS 6 require algorithmic firms to run pre-trade controls (size limits, price collars, message throttles) and an immediate kill switch. This bench tests simulated orders only — nothing is sent to any exchange.</p>
        <section className={cn("border p-3 text-sm", manual || auto ? "border-down bg-down/10" : "border-up/50 bg-card")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{manual ? "HALTED · manual kill switch" : auto ? `HALTED · automatic tripwire: ${auto}` : "ARMED · trading permitted"}</span>
            <Button size="sm" variant={manual ? "outline" : "destructive"} onClick={() => { setManual(!manual); add(manual ? "Kill switch released by operator" : "Kill switch ENGAGED by operator", !manual ? false : true); }}>{manual ? "Release" : "Emergency kill"}</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Live Hawkes n {s.branching?.toFixed(2) ?? "—"} (trip ≥ {DEFAULT_LIMITS.hawkesTrip}) · VPIN {s.vpin?.toFixed(2) ?? "—"} (trip &gt; {DEFAULT_LIMITS.vpinTrip})</p>
        </section>
        <section className="grid gap-2 border border-border bg-card p-3 text-xs sm:grid-cols-4">
          <label className="grid gap-1">Qty BTC (max {DEFAULT_LIMITS.maxOrderQty})<input type="number" value={qty} onChange={(e) => setQty(+e.target.value)} className="border border-input bg-background p-1" /></label>
          <label className="grid gap-1">Reference price<input type="number" value={ref} onChange={(e) => setRef(+e.target.value)} className="border border-input bg-background p-1" /></label>
          <label className="grid gap-1">Price deviation % (collar {DEFAULT_LIMITS.priceCollarPct}%)<input type="number" step="0.1" value={dev} onChange={(e) => setDev(+e.target.value)} className="border border-input bg-background p-1" /></label>
          <div className="flex items-end"><Button className="w-full" onClick={send}>Send test order</Button></div>
        </section>
        <section className="border border-border bg-card p-3 text-xs">
          <h2 className="mb-2 text-sm font-semibold text-primary">Case study · Mango Markets (Oct 2022, ~$114M)</h2>
          <p className="mb-2 text-muted-foreground">The attacker pumped the thin MNGO market so the price oracle marked collateral far above deep spot value, then borrowed against it. An RTS 6-style collar comparing oracle to spot would have halted at step 2.</p>
          <div className="flex flex-wrap gap-2">{MANGO_SCENARIO.map((m, i) => <Button key={m.label} size="sm" variant={i === step ? "default" : "outline"} onClick={() => setStep(i)}>{i + 1}. {m.label}</Button>)}</div>
          <p className="mt-2">Oracle {ms.oracle} · Spot {ms.spot} → <span className={halt ? "font-semibold text-down" : "text-up"}>{halt ?? "Within collar — permitted"}</span></p>
        </section>
        <section className="border border-border bg-card text-xs">
          <div className="border-b border-border px-3 py-1.5 text-muted-foreground">CONTROL AUDIT LOG</div>
          {log.length === 0 ? <p className="p-3 text-muted-foreground">No test orders yet.</p> : <ul className="divide-y divide-border">{log.map((l) => <li key={l.t + l.text} className={cn("px-3 py-1", l.ok ? "text-up" : "text-down")}>{new Date(l.t).toISOString().slice(11, 19)} · {l.text}</li>)}</ul>}
        </section>
      </div>
    </main>
  );
}
