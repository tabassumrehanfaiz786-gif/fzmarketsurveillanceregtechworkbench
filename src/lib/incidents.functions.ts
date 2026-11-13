import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const listSavedIncidents = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  });
  const { data, error } = await sb.from("surveillance_incidents").select("id, detected_at, suspicion, score, reasons, vpin, branching").order("detected_at", { ascending: false }).limit(200);
  if (error) { console.error(error); return { incidents: [], error: "Could not load saved incidents" }; }
  return { incidents: data.map((r) => ({ ...r, score: Number(r.score), vpin: r.vpin == null ? null : Number(r.vpin), branching: r.branching == null ? null : Number(r.branching) })), error: null as string | null };
});
