import { useEffect, useRef, useState } from "react";
import { openMatches } from "@/lib/coinbase";
import { hawkesState, hurstExponent, pushEvent, type HawkesState } from "@/lib/hawkes";

export type HawkesView = HawkesState & { hurst: number | null; live: boolean };

/** Browser-only Coinbase trade feed → rolling Hawkes window. Never affects strategy decisions. */
export function useHawkes(): HawkesView | null {
  const [view, setView] = useState<HawkesView | null>(null);
  const events = useRef<number[]>([]);
  const prices = useRef<number[]>([]);
  useEffect(() => {
    let live = false; let closed = false; let ws: WebSocket | null = null; let retry = 0;
    const connect = () => {
      ws = openMatches((m) => {
        pushEvent(events.current, m.time / 1000);
        prices.current.push(m.price);
        if (prices.current.length > 2000) prices.current.splice(0, prices.current.length - 2000);
      }, () => { live = true; }, () => { live = false; if (!closed) retry = window.setTimeout(connect, 3000); });
    };
    connect();
    const id = window.setInterval(() => {
      setView({ ...hawkesState(events.current, Date.now() / 1000), hurst: hurstExponent(prices.current), live });
    }, 1000);
    return () => { closed = true; clearInterval(id); clearTimeout(retry); ws?.close(); };
  }, []);
  return view;
}
