"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Gauge, Clock, Droplets, Waves, Recycle, ArrowRight, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { RadialGauge } from "@/components/charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import { buildEtpStageFlow } from "@/lib/data/etp-flow";
import { STATUS_COLOR, complianceStatus, ALERT_META } from "@/lib/constants";
import { formatNumber, formatDate, timeAgo } from "@/lib/utils";

export function EtpOverview() {
  const industryId = useAuthStore((s) => s.industryId);
  const industries = useDataStore((s) => s.industries);
  const etpEntries = useDataStore((s) => s.etpEntries);
  const alerts = useDataStore((s) => s.alerts);
  const compliance = useDataStore((s) => s.compliance);

  const industry = industries.find((i) => i.id === industryId);

  const mine = useMemo(
    () => etpEntries.filter((e) => e.industryId === industryId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [etpEntries, industryId],
  );
  const latest = mine[0];
  const myAlerts = alerts.filter((a) => a.industryId === industryId && a.status === "active").slice(0, 5);
  const pending = mine.filter((e) => e.status === "pending").length;
  const myCompliance = compliance.find((c) => c.industryId === industryId);

  if (!industry) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">No ETP unit linked to this session</p>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Sign in or register your unit</Link>
      </div>
    );
  }

  const color = STATUS_COLOR[complianceStatus(industry.complianceScore)];

  const balance = [
    { label: "Fresh Water", value: latest?.freshWaterConsumption, icon: Droplets, accent: "#0ea5e9" },
    { label: "ETP Reuse", value: latest?.etpReuse, icon: Recycle, accent: "#10b981" },
    { label: "RO Permeate", value: latest?.roPermeate, icon: Waves, accent: "#6366f1" },
    { label: "RO Reject", value: latest?.roReject, icon: Waves, accent: "#f59e0b" },
    { label: "Sludge → TSDF", value: latest?.sludgeToTSDF, icon: Trash2, accent: "#a78bfa" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ETP Industry · Daily water balance"
        title={industry.name}
        description={`${industry.area} · Consent ${industry.consentNumber}`}
        actions={
          <Button asChild className="h-10 gap-2 rounded-xl">
            <Link href="/dashboard/etp-entry">
              <Plus className="h-4 w-4" /> Add Today&apos;s Entry
            </Link>
          </Button>
        }
      />

      {/* unit header + quick stats */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:gap-5 sm:p-6">
          <RadialGauge value={industry.complianceScore} size={120} color={color} sublabel="compliance" />
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={industry.status} />
              <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-500">Individual ETP</span>
            </div>
            <p className="mt-2 font-display text-lg font-bold text-foreground">Permitted {formatNumber(industry.permittedKLD)} KLD</p>
            <p className="text-sm text-muted-foreground">Last entry {formatDate(industry.lastReadingAt, true)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat icon={<Gauge className="h-4 w-4" />} label="My Entries" value={mine.length} accent="#0d9488" />
          <Stat icon={<Clock className="h-4 w-4" />} label="Pending" value={pending} accent="#f59e0b" />
          <Stat icon={<Waves className="h-4 w-4" />} label="Alerts" value={myAlerts.length} accent="#ef4444" />
        </div>
      </div>

      {/* total water intake + balance */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Water Intake (latest)</p>
          <p className="mt-2 font-mono text-4xl font-bold text-primary">
            {latest ? formatNumber(latest.totalWaterIntake) : "—"} <span className="text-base font-medium text-muted-foreground">KL</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">= Fresh Water + ETP Reuse + RO Permeate</p>
          {latest && <p className="mt-3 text-xs text-muted-foreground">Recorded {formatDate(latest.date)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {balance.map((b) => (
            <div key={b.label} className="rounded-2xl border border-border bg-card p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${b.accent}1f`, color: b.accent }}>
                {b.icon ? <b.icon className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
              </span>
              <p className="mt-3 font-mono text-xl font-bold text-foreground sm:text-2xl">
                {b.value != null ? formatNumber(b.value) : "—"} <span className="text-xs font-medium text-muted-foreground">KL</span>
              </p>
              <p className="text-xs text-muted-foreground">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ETP pipeline */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">My Treatment Pipeline</h3>
        </div>
        <PipelineFlow flow={buildEtpStageFlow(industry)} />
      </div>

      {/* alerts */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold text-foreground">My Alerts</h3>
        <div className="mt-4 space-y-2.5">
          {myAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No active alerts — keep it up!</p>
          ) : (
            myAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${ALERT_META[a.type].color}1f`, color: ALERT_META[a.type].color }}>
                  <Icon name={ALERT_META[a.type].icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">{timeAgo(a.createdAt)}</p>
                </div>
                <StatusBadge status={a.severity} dot={false} />
              </div>
            ))
          )}
        </div>
        {myCompliance && (
          <Link href="/dashboard/etp-entry" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Record today&apos;s water balance <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}1f`, color: accent }}>{icon}</span>
      <p className="mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
