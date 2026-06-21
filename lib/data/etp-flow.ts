import type { Industry, FlowNode, NodeStatus } from "@/lib/types";

/** Builds a 5-stage ETP treatment pipeline for an individual unit. */
export function buildEtpFlow(ind: Industry): FlowNode[] {
  const s = (v: number): NodeStatus => (v < ind.permittedKLD * 0.2 ? "warning" : "normal");
  const raw = Math.round(ind.permittedKLD * 0.96);
  const etp = Math.round(ind.etpCapacity * 0.9);
  const ro = Math.round(ind.roCapacity * 0.86);
  const mee = Math.round(ind.meeCapacity * 0.78);
  const rec = Math.round(ro * 0.92);
  return [
    { id: `${ind.id}-raw`, label: "Raw Effluent", short: "Raw", type: "raw", value: raw, unit: "KLD", status: "normal" },
    { id: `${ind.id}-etp`, label: "ETP Treatment", short: "ETP", type: "treatment", value: etp, unit: "KLD", status: s(etp) },
    { id: `${ind.id}-ro`, label: "Reverse Osmosis", short: "RO", type: "treatment", value: ro, unit: "KLD", status: s(ro) },
    { id: `${ind.id}-mee`, label: "MEE", short: "MEE", type: "treatment", value: mee, unit: "KLD", status: "normal" },
    { id: `${ind.id}-rec`, label: "Water Recovery", short: "Recovery", type: "recovery", value: rec, unit: "KLD", status: "normal" },
  ];
}
