CREATE TABLE public.surveillance_incidents (
  id text PRIMARY KEY,
  detected_at timestamptz NOT NULL DEFAULT now(),
  venue text NOT NULL DEFAULT 'Coinbase',
  instrument text NOT NULL DEFAULT 'BTC-USD',
  suspicion text NOT NULL,
  score numeric NOT NULL,
  reasons text[] NOT NULL DEFAULT '{}',
  vpin numeric,
  branching numeric,
  source text NOT NULL DEFAULT 'background',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX surveillance_incidents_detected_idx ON public.surveillance_incidents (detected_at DESC);
GRANT SELECT ON public.surveillance_incidents TO anon, authenticated;
GRANT ALL ON public.surveillance_incidents TO service_role;
ALTER TABLE public.surveillance_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the public incident log" ON public.surveillance_incidents FOR SELECT TO anon, authenticated USING (true);