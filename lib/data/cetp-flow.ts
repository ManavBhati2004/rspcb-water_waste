import type { CetpEntry, FlowNode } from "@/lib/types";

/** The 4-stage Water Treatment Pipeline (Inlet → Tertiary Outlet → RO Inlet → RO Permeate)
 *  from raw values — reused for a single entry and for per-plant summed totals. */
export function buildCetpFlowValues(
  key: string,
  v: { inlet: number; tertiaryOutlet: number; roInlet: number; roPermeate: number },
): FlowNode[] {
  return [
    { id: `${key}-inlet`, label: "Inlet", short: "Inlet", type: "raw", value: v.inlet, unit: "", status: "normal" },
    { id: `${key}-tertiary`, label: "Tertiary Outlet", short: "Tertiary", type: "treatment", value: v.tertiaryOutlet, unit: "", status: "normal" },
    { id: `${key}-roinlet`, label: "RO Inlet", short: "RO In", type: "treatment", value: v.roInlet, unit: "", status: "normal" },
    { id: `${key}-ropermeate`, label: "RO Permeate", short: "Permeate", type: "recovery", value: v.roPermeate, unit: "", status: "normal" },
  ];
}

/** Data-flow pipeline for a single CETP entry. */
export function buildCetpFlow(entry: CetpEntry): FlowNode[] {
  return buildCetpFlowValues(entry.id, entry);
}
