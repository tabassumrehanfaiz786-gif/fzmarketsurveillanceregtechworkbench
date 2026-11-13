import type { Incident } from "@/lib/incidents";
import { cn } from "@/lib/utils";

export function IncidentRegistry({ log, onDraft, max = 8 }: { log: Incident[]; onDraft?: (i: Incident) => void; max?: number }) {
  return (
    <section aria-label="Market abuse incident registry" className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>MARKET ABUSE INCIDENT REGISTRY · UK MAR Art 16(2)</span><span>{log.length} this session</span>
      </div>
      {log.length === 0 ? <p className="p-3 text-xs text-muted-foreground">No surveillance threshold breached yet. Listening to live prints…</p> : (
        <ul className="divide-y divide-border">
          {log.slice(0, max).map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2 px-3 py-1.5 text-xs">
              <span className="tabular-nums text-muted-foreground">{new Date(i.t).toISOString().slice(11, 19)}</span>
              <span className={cn("font-semibold", i.suspicion.startsWith("Disorderly") ? "text-down" : "text-primary")}>{i.suspicion}</span>
              <span className="text-muted-foreground">{i.reasons.join(" · ")}</span>
              {onDraft && <button type="button" onClick={() => onDraft(i)} className="ml-auto underline">Inspect & draft STOR</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
