import { useEffect, useState } from "react";
import { useHawkes } from "./use-hawkes";
import { useVpin } from "./use-vpin";
import { recordIncident, type Incident } from "@/lib/incidents";

/** Live surveillance signals plus a bounded session incident registry. Display-only. */
export function useSurveillance() {
  const h = useHawkes();
  const v = useVpin();
  const [log, setLog] = useState<Incident[]>([]);
  const branching = h?.branchingRatio ?? null;
  const vpin = v.vpin;
  useEffect(() => {
    if (branching == null && vpin == null) return;
    setLog((l) => recordIncident(l, { snifferScore: null, vpin, branching }, Date.now()));
  }, [branching, vpin]);
  return { branching, vpin, live: !!h?.live || v.live, log };
}
