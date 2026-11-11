import { useHawkes } from "@/hooks/use-hawkes";
import { REGIME_LABEL } from "@/lib/hawkes";
import { cn } from "@/lib/utils";

export function HawkesRadar() {
  const h = useHawkes();
  const regime = h?.regime ?? "ORGANIC";
  const dot = regime === "CASCADE_HAZARD" ? "bg-down animate-pulse" : regime === "EXCITED" ? "bg-primary animate-pulse" : "bg-up";
  const text = regime === "CASCADE_HAZARD" ? "text-down" : regime === "EXCITED" ? "text-primary" : "text-up";
  return (
    <section aria-label="Hawkes Point-Process Cascade Radar" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 border border-border bg-card px-3 py-1.5 text-[11px]", regime === "CASCADE_HAZARD" && "border-down/60")}>
      <span className="uppercase tracking-[0.18em] text-muted-foreground">Hawkes Cascade Radar</span>
      {h ? <>
        <span className="tabular-nums">λ <b>{h.intensity.toFixed(2)}</b>/s</span>
        <span className="tabular-nums">n <b>{h.branchingRatio.toFixed(2)}</b></span>
        <span className="tabular-nums text-muted-foreground">H {h.hurst == null ? "—" : h.hurst.toFixed(2)}</span>
        <span className={cn("flex items-center gap-1.5 font-semibold", text)}><span className={cn("h-2 w-2 rounded-full", dot)} />{REGIME_LABEL[regime]}</span>
        <span className="text-muted-foreground">conf {(h.confidence * 100).toFixed(0)}% · {h.live ? "Coinbase live" : "reconnecting"} · estimate</span>
      </> : <span className="text-muted-foreground">Warming up…</span>}
    </section>
  );
}
