import { useEffect, useRef, useState } from "react";
import { openMatches } from "@/lib/coinbase";
import { addTradeToVpin, calculateVpinRegime, createVpinTracker, vpinValue, type VpinRegime } from "@/lib/vpin";

export type VpinView = { vpin: number | null; regime: VpinRegime | null; buckets: number; live: boolean };

/** Browser-only Coinbase prints → volume-clock VPIN. Display-only. */
export function useVpin(): VpinView {
  const [view, setView] = useState<VpinView>({ vpin: null, regime: null, buckets: 0, live: false });
  const tr = useRef(createVpinTracker());
  useEffect(() => {
    let live = false; let closed = false; let ws: WebSocket | null = null; let retry = 0;
    const connect = () => {
      ws = openMatches((m) => addTradeToVpin(tr.current, m.qty, m.side), () => { live = true; },
        () => { live = false; if (!closed) retry = window.setTimeout(connect, 3000); });
    };
    connect();
    const id = window.setInterval(() => {
      const v = vpinValue(tr.current);
      setView({ vpin: v, regime: v == null ? null : calculateVpinRegime(v), buckets: tr.current.imbalances.length, live });
    }, 1000);
    return () => { closed = true; clearInterval(id); clearTimeout(retry); ws?.close(); };
  }, []);
  return view;
}
