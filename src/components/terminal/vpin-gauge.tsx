import { useVpin } from "@/hooks/use-vpin";
import { cn } from "@/lib/utils";

export function VpinGauge() {
  const v = useVpin();
  const tone = v.regime === "TOXIC" ? "text-down" : v.regime === "ELEVATED" ? "text-primary" : "text-up";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-3 py-2 font-mono text-[11px]">
      <span className="font-semibold uppercase tracking-wider text-muted-foreground">VPIN Toxicity</span>
      <span>VPIN <b className={tone}>{v.vpin == null ? "—" : v.vpin.toFixed(3)}</b></span>
      <span className={cn("rounded px-1.5 py-0.5 border border-current", tone, v.regime === "TOXIC" && "animate-pulse")}>
        {v.regime ?? (v.live ? `filling buckets ${v.buckets}/5` : "connecting")}
      </span>
      <span className="text-muted-foreground">5 BTC buckets · window 50</span>
    </div>
  );
}
