"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Gauge, Waves, Droplets, Recycle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import { buildCetpFlow } from "@/lib/data/cetp-flow";
import { formatNumber, formatDate } from "@/lib/utils";

export function OperatorOverview() {
  const industryId = useAuthStore((s) => s.industryId);
  const industries = useDataStore((s) => s.industries);
  const cetpEntries = useDataStore((s) => s.cetpEntries);

  const industry = industries.find((i) => i.id === industryId);

  const mine = useMemo(
    () => cetpEntries.filter((e) => e.industryId === industryId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [cetpEntries, industryId],
  );
  const latest = mine[0];

  if (!industry) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">No unit linked to this session</p>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Sign in and pick your unit</Link>
      </div>
    );
  }

  const balance = [
    { label: "Inlet", value: latest?.inlet, accent: "#6366f1" },
    { label: "Tertiary Outlet", value: latest?.tertiaryOutlet, accent: "#0ea5e9" },
    { label: "RO Inlet", value: latest?.roInlet, accent: "#8b5cf6" },
    { label: "RO Permeate", value: latest?.roPermeate, accent: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CETP Industry · Daily data"
        title={industry.name}
        description={`${industry.area} · Consent ${industry.consentNumber}`}
        actions={
          <Button asChild className="h-10 gap-2 rounded-xl">
            <Link href="/dashboard/entry">
              <Plus className="h-4 w-4" /> Add Today&apos;s Entry
            </Link>
          </Button>
        }
      />

      {/* unit header + quick data stats */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={industry.status} />
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-500">CETP Industry</span>
          </div>
          <p className="mt-3 font-display text-lg font-bold text-foreground">Permitted {formatNumber(industry.permittedKLD)} KLD</p>
          <p className="text-sm text-muted-foreground">Last entry {formatDate(industry.lastReadingAt, true)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat icon={<Gauge className="h-4 w-4" />} label="My Entries" value={formatNumber(mine.length)} accent="#6366f1" />
          <Stat icon={<Waves className="h-4 w-4" />} label="Latest Inlet" value={latest ? formatNumber(latest.inlet) : "—"} accent="#0ea5e9" />
          <Stat icon={<Recycle className="h-4 w-4" />} label="RO Permeate" value={latest ? formatNumber(latest.roPermeate) : "—"} accent="#10b981" />
        </div>
      </div>

      {/* latest entry data */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {balance.map((b) => (
          <div key={b.label} className="rounded-2xl border border-border bg-card p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${b.accent}1f`, color: b.accent }}>
              <Droplets className="h-4 w-4" />
            </span>
            <p className="mt-3 font-mono text-xl font-bold text-foreground sm:text-2xl">{b.value != null ? formatNumber(b.value) : "—"}</p>
            <p className="text-xs text-muted-foreground">{b.label}</p>
          </div>
        ))}
      </div>

      {/* RO reject routing */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Recycle className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">RO Reject Routing</h3>
          <span className="text-xs text-muted-foreground">{latest ? formatDate(latest.date) : "No entry"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Route label="MEE Inlet" value={latest?.meeInlet} />
          <Route label="ZLD Outlet" value={latest?.zldOutlet} tss={latest?.zldOutletTSS} />
          <Route label="SEP Inlet" value={latest?.sepInlet} tss={latest?.sepInletTSS} />
        </div>
      </div>

      {/* flow of data */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Flow of Data</h3>
        </div>
        {latest ? (
          <PipelineFlow flow={buildCetpFlow(latest)} />
        ) : (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No entries yet. <Link href="/dashboard/entry" className="font-semibold text-primary hover:underline">Add today&apos;s entry</Link> to see the flow.
          </div>
        )}
      </div>

      {/* recent entries */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold text-foreground">Recent Entries</h3>
        <div className="mt-4 space-y-2">
          {mine.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No entries recorded yet.</p>
          ) : (
            mine.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                <span className="text-sm font-medium text-foreground">{formatDate(e.date)}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Inlet <span className="font-mono font-semibold text-foreground">{formatNumber(e.inlet)}</span></span>
                  <span>RO Permeate <span className="font-mono font-semibold text-foreground">{formatNumber(e.roPermeate)}</span></span>
                </div>
              </div>
            ))
          )}
        </div>
        <Link href="/dashboard/entry" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          Add today&apos;s entry <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}1f`, color: accent }}>{icon}</span>
      <p className="mt-3 font-mono text-xl font-bold text-foreground sm:text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Route({ label, value, tss }: { label: string; value?: number; tss?: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-foreground">
        {value != null ? formatNumber(value) : "—"} <span className="text-xs font-normal text-muted-foreground">KL</span>
      </p>
      {tss != null && <p className="mt-0.5 text-[11px] text-muted-foreground">TSS <span className="font-mono font-semibold text-foreground">{formatNumber(tss)}</span></p>}
    </div>
  );
}
