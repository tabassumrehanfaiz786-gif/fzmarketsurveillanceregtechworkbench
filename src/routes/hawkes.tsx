import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHawkes, type HawkesView } from "@/hooks/use-hawkes";
import { DEFAULT_HAWKES, REGIME_LABEL } from "@/lib/hawkes";

export const Route = createFileRoute("/hawkes")({
  head: () => ({
    meta: [
      { title: "Hawkes Cascade Radar — FZ Quant Terminal" },
      { name: "description", content: "Live self-exciting Hawkes point-process radar on Coinbase BTC trades: intensity, branching ratio and liquidation cascade hazard." },
      { property: "og:title", content: "Hawkes Cascade Radar — FZ Quant Terminal" },
      { property: "og:description", content: "Detect adverse selection and liquidation cascades from live trade arrival clustering." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HawkesPage,
});

type Pt = HawkesView & { t: number };
const KEEP = 300;

function Spark({ data, max, threshold, cls }: { data: number[]; max: number; threshold?: number; cls: string }) {
  const W = 600, H = 140, m = Math.max(max, 1e-9);
  const pts = data.map((v, i) => `${(i / Math.max(1, KEEP - 1)) * W},${H - (Math.min(v, m) / m) * H}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" preserveAspectRatio="none">
      {threshold != null && <line x1={0} x2={W} y1={H - (threshold / m) * H} y2={H - (threshold / m) * H} className="stroke-down" strokeDasharray="4 4" />}
      <polyline points={pts} fill="none" strokeWidth={1.5} className={cls} />
    </svg>
  );
}

function HawkesPage() {
  const h = useHawkes();
  const [hist, setHist] = useState<Pt[]>([]);
  const [log, setLog] = useState<{ t: number; n: number; lam: number; regime: string }[]>([]);
  useEffect(() => {
    if (!h) return;
    setHist((p) => [...p, { ...h, t: Date.now() }].slice(-KEEP));
    setLog((l) => {
      const prev = l[0];
      if (h.regime !== "ORGANIC" && (!prev || prev.regime !== h.regime || Date.now() - prev.t > 15000))
        return [{ t: Date.now(), n: h.branchingRatio, lam: h.intensity, regime: h.regime }, ...l].slice(0, 50);
      return l;
    });
  }, [h]);
  const regime = h?.regime ?? "ORGANIC";
  const tone = regime === "CASCADE_HAZARD" ? "text-down" : regime === "EXCITED" ? "text-primary" : "text-up";
  const beta = DEFAULT_HAWKES.beta, n = h?.branchingRatio ?? 0;
  const rate = h ? h.intensity : 0;
  const lamMax = Math.max(1, ...hist.map((p) => p.intensity)) * 1.1;
  const cascades = hist.filter((p) => p.regime === "CASCADE_HAZARD").length;

  return (
    <main className="min-h-screen bg-background p-4 font-mono text-xs text-foreground">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-semibold">Hawkes Point-Process Cascade Radar</h1>
          <p className="text-muted-foreground">λ(t) = μ + Σ α·e<sup>−β(t−tᵢ)</sup> on live Coinbase BTC-USD prints · {DEFAULT_HAWKES.windowSec}s window · <span className={h?.live ? "text-up" : "text-down"}>{h?.live ? "LIVE" : "connecting"}</span> · estimates only</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([["/", "Terminal"], ["/tape", "Tape"], ["/icebergs", "Icebergs"], ["/bookmap", "Bookmap"], ["/leadlag", "Lead-Lag"], ["/sniffer", "Sniffer"]] as const).map(([to, l]) =>
            <Button key={to} asChild size="sm" variant="outline" className="h-7 text-[11px]"><Link to={to}>{l}</Link></Button>)}
        </div>
      </header>

      <section className={cn("mb-3 flex flex-wrap items-center gap-3 border border-border bg-card p-3", regime === "CASCADE_HAZARD" && "border-down/60")}>
        <span className={cn("h-3 w-3 rounded-full", regime === "CASCADE_HAZARD" ? "bg-down animate-pulse" : regime === "EXCITED" ? "bg-primary animate-pulse" : "bg-up")} />
        <span className={cn("font-display text-lg font-semibold", tone)}>{h ? REGIME_LABEL[regime] : "Warming up…"}</span>
        <span className="text-muted-foreground">{regime === "CASCADE_HAZARD" ? "Trades are mostly triggering other trades — adverse selection / liquidation cascade risk." : regime === "EXCITED" ? "Order flow is clustering above organic arrival." : "Arrivals look close to independent (Poisson)."}</span>
      </section>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat k="Intensity λ" v={h ? `${h.intensity.toFixed(2)}/s` : "—"} />
        <Stat k="Branching n" v={h ? n.toFixed(3) : "—"} cls={tone} />
        <Stat k="Baseline μ (est)" v={h ? `${(rate * (1 - n)).toFixed(2)}/s` : "—"} />
        <Stat k="Jump α = nβ" v={h ? (n * beta).toFixed(3) : "—"} />
        <Stat k="Decay β" v={`${beta}/s · t½ ${(Math.LN2 / beta).toFixed(1)}s`} />
        <Stat k="Hurst H" v={h?.hurst == null ? "—" : h.hurst.toFixed(2)} sub={h?.hurst != null && h.hurst < 0.5 ? "rough" : undefined} />
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <section className="border border-border bg-card p-3">
          <h2 className="mb-2 uppercase tracking-[0.18em] text-muted-foreground">Intensity λ(t) · last {hist.length}s</h2>
          <Spark data={hist.map((p) => p.intensity)} max={lamMax} cls="stroke-primary" />
        </section>
        <section className="border border-border bg-card p-3">
          <h2 className="mb-2 uppercase tracking-[0.18em] text-muted-foreground">Branching ratio n · cascade line 0.85</h2>
          <Spark data={hist.map((p) => p.branchingRatio)} max={1} threshold={0.85} cls="stroke-up" />
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <section className="border border-border bg-card p-3">
          <h2 className="mb-2 uppercase tracking-[0.18em] text-muted-foreground">Excitation event log</h2>
          {!log.length ? <p className="text-muted-foreground">No excited or cascade regimes this session yet.</p> :
            <table className="w-full"><tbody>{log.map((e) => (
              <tr key={e.t} className="border-t border-border"><td className="py-1">{new Date(e.t).toISOString().slice(11, 19)}</td>
                <td className={e.regime === "CASCADE_HAZARD" ? "text-down" : "text-primary"}>{REGIME_LABEL[e.regime as keyof typeof REGIME_LABEL]}</td>
                <td className="tabular-nums">n {e.n.toFixed(2)}</td><td className="tabular-nums">λ {e.lam.toFixed(2)}/s</td></tr>))}</tbody></table>}
        </section>
        <section className="border border-border bg-card p-3">
          <h2 className="mb-2 uppercase tracking-[0.18em] text-muted-foreground">Flow composition</h2>
          <Row k="Endogenous (self-excited)" v={`${(n * 100).toFixed(0)}%`} />
          <Row k="Exogenous (news/organic)" v={`${((1 - n) * 100).toFixed(0)}%`} />
          <Row k="Seconds in cascade" v={`${cascades}s / ${hist.length}s`} />
          <Row k="Confidence" v={h ? `${(h.confidence * 100).toFixed(0)}%` : "—"} />
          <p className="mt-2 text-[10px] text-muted-foreground">Display only — never changes paper-trading decisions.</p>
        </section>
      </div>
    </main>
  );
}

function Stat({ k, v, sub, cls }: { k: string; v: string; sub?: string; cls?: string }) {
  return <div className="border border-border bg-card p-2"><div className="text-[10px] uppercase text-muted-foreground">{k}</div><div className={cn("text-sm font-semibold tabular-nums", cls)}>{v}</div>{sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}</div>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-t border-border py-1"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}</span></div>;
}
