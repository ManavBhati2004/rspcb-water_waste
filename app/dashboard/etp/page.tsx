"use client";

import Link from "next/link";
import { Droplets, Plus, Recycle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { RadialGauge } from "@/components/charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/store/data";
import { buildEtpFlow } from "@/lib/data/etp-flow";
import { STATUS_COLOR, complianceStatus } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export default function IndividualEtpPage() {
  const industries = useDataStore((s) => s.industries);
  const etps = industries.filter((i) => i.isIndividualETP);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Individual ETP Units"
        description="Industries operating their own Effluent Treatment Plants outside a CETP — each with dedicated flow meters and compliance."
        actions={
          <Button asChild className="h-10 gap-2 rounded-xl">
            <Link href="/dashboard/industries/register">
              <Plus className="h-4 w-4" /> Register ETP
            </Link>
          </Button>
        }
      />

      {etps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No individual ETP units registered.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {etps.map((ind) => {
            const color = STATUS_COLOR[complianceStatus(ind.complianceScore)];
            return (
              <div key={ind.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
                      <Droplets className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-display text-lg font-bold text-foreground">{ind.name}</h3>
                    <p className="text-sm text-muted-foreground">{ind.area}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={ind.status} />
                      <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">Individual ETP</span>
                    </div>
                  </div>
                  <RadialGauge value={ind.complianceScore} size={104} color={color} sublabel="compliance" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: "Permitted", v: ind.permittedKLD },
                    { l: "ETP", v: ind.etpCapacity },
                    { l: "RO", v: ind.roCapacity },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                      <p className="font-mono text-sm font-bold text-foreground">{formatNumber(s.v)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.l} KLD</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Recycle className="h-4 w-4 text-primary" /> Treatment Pipeline
                  </p>
                  <PipelineFlow flow={buildEtpFlow(ind)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
