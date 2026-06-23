"use client";

import { useMemo } from "react";
import { Droplets, Recycle, Waves } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { RadialGauge } from "@/components/charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDataStore } from "@/lib/store/data";
import { buildEtpStageFlow } from "@/lib/data/etp-flow";
import { STATUS_COLOR, complianceStatus } from "@/lib/constants";
import { formatNumber, formatDate } from "@/lib/utils";

export default function IndividualEtpPage() {
  const industries = useDataStore((s) => s.industries);
  const etpEntries = useDataStore((s) => s.etpEntries);
  const etps = industries.filter((i) => i.isIndividualETP);

  const latestByIndustry = useMemo(() => {
    const map: Record<string, (typeof etpEntries)[number] | undefined> = {};
    for (const e of [...etpEntries].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))) {
      map[e.industryId] = e; // last write wins → latest
    }
    return map;
  }, [etpEntries]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Individual ETP Units"
        description="Industries operating their own Effluent Treatment Plants — self-registered, with RO-stage capacities and a daily water balance."
      />

      {etps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No individual ETP units registered.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {etps.map((ind) => {
            const color = STATUS_COLOR[complianceStatus(ind.complianceScore)];
            const latest = latestByIndustry[ind.id];
            const caps = [
              { l: "Permitted", v: ind.permittedKLD },
              { l: "ETP", v: ind.etpCapacity },
              { l: "Max Effluent", v: ind.maxEffluentGeneration ?? ind.permittedKLD },
              { l: "MEE", v: ind.meeCapacity },
              { l: "RO I", v: ind.roStage1 ?? ind.roCapacity },
              { l: "RO II", v: ind.roStage2 ?? 0 },
              { l: "RO III", v: ind.roStage3 ?? 0 },
              { l: "RO IV", v: ind.roStage4 ?? 0 },
            ];
            return (
              <div key={ind.id} className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-500">
                      <Droplets className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-display text-lg font-bold text-foreground">{ind.name}</h3>
                    <p className="text-sm text-muted-foreground">{ind.area}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={ind.status} />
                      <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-500">Individual ETP</span>
                    </div>
                  </div>
                  <RadialGauge value={ind.complianceScore} size={104} color={color} sublabel="compliance" />
                </div>

                {/* capacities (KLD) */}
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Capacities (KLD)</p>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {caps.map((s) => (
                    <div key={s.l} className="rounded-xl border border-border bg-muted/30 p-2 text-center">
                      <p className="font-mono text-sm font-bold text-foreground">{formatNumber(s.v)}</p>
                      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* latest water balance (KL) */}
                <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Waves className="h-3.5 w-3.5 text-primary" /> Latest Water Balance
                    </p>
                    <span className="text-[10px] text-muted-foreground">{latest ? formatDate(latest.date) : "No entry"}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Mini label="Total Intake" value={latest?.totalWaterIntake} accent="#0d9488" />
                    <Mini label="ETP Reuse" value={latest?.etpReuse} accent="#10b981" />
                    <Mini label="RO Permeate" value={latest?.roPermeate} accent="#6366f1" />
                    <Mini label="Sludge→TSDF" value={latest?.sludgeToTSDF} accent="#a78bfa" />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Recycle className="h-4 w-4 text-primary" /> Treatment Pipeline
                  </p>
                  <PipelineFlow flow={buildEtpStageFlow(ind)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value?: number; accent: string }) {
  return (
    <div className="rounded-lg bg-card p-2 text-center">
      <p className="font-mono text-sm font-bold" style={{ color: accent }}>
        {value != null ? formatNumber(value) : "—"}
      </p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label} (KL)</p>
    </div>
  );
}
