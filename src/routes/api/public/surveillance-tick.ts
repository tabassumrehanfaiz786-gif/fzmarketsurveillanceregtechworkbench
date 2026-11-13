import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { parseRestTrade, scanSignals } from "@/lib/background-scan";
import { classify } from "@/lib/stor";
import { CB_REST } from "@/lib/coinbase";
import { COOLDOWN_MS } from "@/lib/incidents";

// Scheduled every minute: samples public prints and records breaches, even when no browser is open.
export const Route = createFileRoute("/api/public/surveillance-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const res = await fetch(`${CB_REST}/products/BTC-USD/trades?limit=1000`, { headers: { "User-Agent": "fz-surveillance" } });
        if (!res.ok) return Response.json({ ok: false, error: "feed unavailable" }, { status: 502 });
        const signals = scanSignals(((await res.json()) as unknown[]).map(parseRestTrade));
        const c = classify(signals);
        if (c.suspicion === "None") return Response.json({ ok: true, recorded: false, signals });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
        const { data: recent } = await supabaseAdmin.from("surveillance_incidents").select("id").eq("suspicion", c.suspicion).gte("detected_at", since).limit(1);
        if (recent?.length) return Response.json({ ok: true, recorded: false, reason: "cooldown" });
        const t = Date.now();
        const { error } = await supabaseAdmin.from("surveillance_incidents").insert({
          id: `INC-${t}-${c.suspicion.slice(0, 3)}`, detected_at: new Date(t).toISOString(), suspicion: c.suspicion,
          score: c.score, reasons: c.reasons, vpin: signals.vpin, branching: signals.branching,
        });
        if (error) { console.error(error); return Response.json({ ok: false }, { status: 500 }); }
        return Response.json({ ok: true, recorded: true });
      },
    },
  },
});
