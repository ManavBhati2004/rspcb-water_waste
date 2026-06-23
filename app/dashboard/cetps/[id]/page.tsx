"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Gauge, Recycle, ShieldCheck, Users, Factory, Droplets, Zap, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { StatusBadge } from "@/components/shared/status-badge";
import { cetps, buildCetpTrends } from "@/lib/data/seed";
import { useDataStore } from "@/lib/store/data";
import type { CetpId } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export default function CetpDetailPage() {
  const params = useParams<{ id: string }>();
  const cetp = cetps.find((c) => c.id === params.id);
  const industries = useDataStore((s) => s.industries);
  const trends = useMemo(() => buildCetpTrends().find((t) => t.cetpId === (params.id as CetpId)), [params.id]);

  if (!cetp) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">CETP not found</p>
        <Link href="/dashboard/cetps" className="text-sm font-semibold text-primary hover:underline">
          Back to CETPs
        </Link>
      </div>
    );
  }

  const connected = industries.filter((ind) => ind.cetpId === cetp.id);
  const util = Math.round((cetp.treatedKLD / cetp.capacityKLD) * 100);

  const stats = [
    { icon: Gauge, label: "Capacity", value: `${formatNumber(cetp.capacityKLD)}`, unit: "KLD", color: "#22d3ee" },
    { icon: Droplets, label: "Treated", value: `${formatNumber(cetp.treatedKLD)}`, unit: "KLD", color: "#60a5fa" },
    { icon: Recycle, label: "Recovery", value: `${cetp.recoveryRate}`, unit: "%", color: "#34d399" },
    { icon: ShieldCheck, label: "Compliance", value: `${cetp.complianceScore}`, unit: "%", color: "#a78bfa" },
    { icon: Users, label: "Members", value: `${formatNumber(cetp.members)}`, unit: "", color: "#fbbf24" },
    { icon: Factory, label: "Monitored", value: `${connected.length}`, unit: "units", color: "#f472b6" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/cetps" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All CETPs
      </Link>

      <PageHeader
        eyebrow={`${cetp.district} · Est. ${cetp.established}`}
        title={cetp.name}
        description={cetp.description}
        actions={<StatusBadge status={cetp.status} className="h-7 px-3 text-sm" />}
      />

      {/* stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${s.color}1f`, color: s.color }}>
              <s.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-xl font-bold text-foreground">
              {s.value}
              {s.unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{s.unit}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* pipeline */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Live Treatment Pipeline</h3>
              <p className="text-xs text-muted-foreground">Water flowing through each stage · live meter values</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              Flowing
            </span>
          </div>
          <PipelineFlow flow={cetp.flow} />
        </div>

        {/* right column */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">Throughput</h3>
              <span className="font-mono text-sm font-semibold text-cyan-400">{util}% util</span>
            </div>
            <p className="text-xs text-muted-foreground">Recent weekly treated volume (KLD)</p>
            <div className="mt-3 space-y-1.5">
              {trends?.wastewater.slice(-6).map((w) => (
                <div key={w.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">{w.label}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatNumber(Number(w.value) || 0)} <span className="font-normal text-muted-foreground">KLD</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-lg font-bold text-foreground">Treatment Technologies</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {cetp.technologies.map((t) => (
                <span key={t} className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
                  {t}
                </span>
              ))}
            </div>
            <Link
              href="/dashboard/energy"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Zap className="h-4 w-4" /> View energy monitoring
            </Link>
          </div>
        </div>
      </div>

      {/* connected industries */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-foreground">Connected Industries ({connected.length})</h3>
          <Link href="/dashboard/industries" className="text-xs font-semibold text-primary hover:underline">
            Manage all
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {connected.map((ind) => (
            <Link
              key={ind.id}
              href="/dashboard/industries"
              className="group flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{ind.name}</p>
                <p className="text-xs text-muted-foreground">{ind.permittedKLD} KLD · {ind.area.split(",")[0]}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={ind.status} dot={false} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
