import type { CetpEntry, FlowNode } from "@/lib/types";

/** Data-flow pipeline for a CETP entry: the treated stream
 *  Inlet → Tertiary Outlet → RO Inlet → RO Permeate.
 *  (RO Reject routing — MEE / ZLD / SEP — is shown separately as data.) */
export function buildCetpFlow(entry: CetpEntry): FlowNode[] {
  return [
    { id: `${entry.id}-inlet`, label: "Inlet", short: "Inlet", type: "raw", value: entry.inlet, unit: "", status: "normal" },
    { id: `${entry.id}-tertiary`, label: "Tertiary Outlet", short: "Tertiary", type: "treatment", value: entry.tertiaryOutlet, unit: "", status: "normal" },
    { id: `${entry.id}-roinlet`, label: "RO Inlet", short: "RO In", type: "treatment", value: entry.roInlet, unit: "", status: "normal" },
    { id: `${entry.id}-ropermeate`, label: "RO Permeate", short: "Permeate", type: "recovery", value: entry.roPermeate, unit: "", status: "normal" },
  ];
}
