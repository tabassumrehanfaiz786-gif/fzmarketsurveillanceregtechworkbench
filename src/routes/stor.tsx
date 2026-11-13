import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSurveillance } from "@/hooks/use-surveillance";
import { IncidentRegistry } from "@/components/terminal/incident-registry";
import { buildStor, type StorDraft } from "@/lib/stor";

export const Route = createFileRoute("/stor")({
  head: () => ({
    meta: [
      { title: "FCA STOR Draft Generator — FZ Surveillance Workbench" },
      { name: "description", content: "Draft Suspicious Transaction and Order Reports (UK MAR Art 16, FCA SUP 15.10) from live surveillance signals." },
      { property: "og:title", content: "FCA STOR Draft Generator — FZ Surveillance Workbench" },
      { property: "og:description", content: "Live Hawkes and VPIN signals mapped into audit-ready STOR drafts for compliance review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorPage,
});

function download(d: StorDraft) {
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${d.ref}.json`; a.click(); URL.revokeObjectURL(a.href);
}

function StorPage() {
  const s = useSurveillance();
  const [draft, setDraft] = useState<StorDraft | null>(null);
  return (
    <main className="min-h-screen bg-background p-4 font-mono text-foreground">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">FCA STOR Draft Generator</h1>
          <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to="/killswitch">RTS 6 Kill Switch</Link></Button><Button asChild size="sm" variant="outline"><Link to="/">Workbench</Link></Button></div>
        </div>
        <p className="text-sm text-muted-foreground">UK MAR Art 16(2) and FCA SUP 15.10 require firms to detect and report suspicious orders and transactions. This tool drafts a STOR from live public Coinbase BTC-USD signals. Drafts are statistical estimates for a compliance officer to review — they identify no participant and are never filed automatically.</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="border border-border bg-card p-2"><div className="text-muted-foreground">Feed</div><div>{s.live ? "LIVE" : "connecting…"}</div></div>
          <div className="border border-border bg-card p-2"><div className="text-muted-foreground">Hawkes n</div><div>{s.branching?.toFixed(2) ?? "—"}</div></div>
          <div className="border border-border bg-card p-2"><div className="text-muted-foreground">VPIN</div><div>{s.vpin?.toFixed(2) ?? "—"}</div></div>
        </div>
        <Button onClick={() => setDraft(buildStor({ snifferScore: null, vpin: s.vpin, branching: s.branching }, new Date()))}>Draft STOR from current signals</Button>
        <IncidentRegistry log={s.log} max={20} onDraft={(i) => setDraft(buildStor(i.signals, new Date(i.t)))} />
        {draft && (
          <section className="space-y-2 border border-primary/50 bg-card p-3 text-xs">
            <h2 className="text-sm font-semibold text-primary">{draft.ref}</h2>
            <dl className="grid grid-cols-[140px_1fr] gap-1">
              <dt className="text-muted-foreground">Created (UTC)</dt><dd>{draft.createdAt}</dd>
              <dt className="text-muted-foreground">Venue / instrument</dt><dd>{draft.venue} · {draft.instrument}</dd>
              <dt className="text-muted-foreground">Suspected typology</dt><dd>{draft.suspicion}</dd>
              <dt className="text-muted-foreground">Indicator score</dt><dd>{draft.score.toFixed(2)}</dd>
              <dt className="text-muted-foreground">Statutory basis</dt><dd>UK MAR Art 12 (manipulation), Art 14 (insider dealing), Art 16(2) (STOR duty); FCA SUP 15.10</dd>
            </dl>
            <p>{draft.narrative}</p>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => download(draft)}>Download JSON</Button><Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button></div>
          </section>
        )}
      </div>
    </main>
  );
}
