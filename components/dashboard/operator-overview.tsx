"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Gauge, Waves, Zap, Clock, ArrowRight, Droplets } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { RadialGauge } from "@/components/charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import { buildEtpFlow } from "@/lib/data/etp-flow";
import { STATUS_COLOR, complianceStatus, ALERT_META } from "@/lib/constants";
import { formatNumber, formatDate, timeAgo } from "@/lib/utils";

export function OperatorOverview() {
  const industryId = useAuthStore((s) => s.industryId);
  const industries = useDataStore((s) => s.industries);
  const readings = useDataStore((s) => s.readings);
  const alerts = useDataStore((s) => s.alerts);
  const compliance = useDataStore((s) => s.compliance);

  const industry = industries.find((i) => i.id === industryId);

  const mine = useMemo(
    () => readings.filter((r) => r.industryId === industryId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [readings, industryId],
  );
  const latestFlow = mine.find((r) => r.meterPoint !== "Energy Meter");
  const latestEnergy = mine.find((r) => r.meterPoint === "Energy Meter");
  const myAlerts = alerts.filter((a) => a.industryId === industryId && a.status === "active").slice(0, 5);
  const myCompliance = compliance.find((c) => c.industryId === industryId);
  const pending = mine.filter((r) => r.status === "pending").length;

  if (!industry) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">No unit linked to this session</p>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Sign in and pick your unit</Link>
      </div>
    );
  }

  const color = STATUS_COLOR[complianceStatus(industry.complianceScore)];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Industry Owner · Daily monitoring"
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

      {/* unit header + quick stats */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6">
          <RadialGauge value={industry.complianceScore} size={120} color={color} sublabel="compliance" />
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={industry.status} />
              {industry.isIndividualETP && <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-500">Individual ETP</span>}
            </div>
            <p className="mt-2 font-display text-lg font-bold text-foreground">Permitted {formatNumber(industry.permittedKLD)} KLD</p>
            <p className="text-sm text-muted-foreground">Last reading {formatDate(industry.lastReadingAt, true)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Gauge className="h-4 w-4" />} label="My Readings" value={mine.length} accent="#6366f1" />
          <Stat icon={<Clock className="h-4 w-4" />} label="Pending" value={pending} accent="#f59e0b" />
          <Stat icon={<Waves className="h-4 w-4" />} label="Alerts" value={myAlerts.length} accent="#ef4444" />
        </div>
      </div>

      {/* single flow + single energy sector */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EntryCard
          title="Flow Meter Reading"
          icon={<Waves className="h-5 w-5" />}
          accent="#6366f1"
          value={latestFlow ? `${formatNumber(latestFlow.difference)} ${latestFlow.unit}` : "—"}
          meta={latestFlow ? `${latestFlow.meterPoint} · ${formatDate(latestFlow.date)} ${latestFlow.readingTime}` : "No reading yet"}
          status={latestFlow?.status}
        />
        <EntryCard
          title="Energy Consumption"
          icon={<Zap className="h-5 w-5" />}
          accent="#8b5cf6"
          value={latestEnergy ? `${formatNumber(latestEnergy.difference)} kWh` : "—"}
          meta={latestEnergy ? `${formatDate(latestEnergy.date)} ${latestEnergy.readingTime}` : "No reading yet"}
          status={latestEnergy?.status}
        />
      </div>

      {/* steps summary pipeline */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">My Treatment Pipeline</h3>
        </div>
        <PipelineFlow flow={buildEtpFlow(industry)} />
      </div>

      {/* my alerts */}
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
          <Link href="/dashboard/entry" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Record today&apos;s reading <ArrowRight className="h-4 w-4" />
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

function EntryCard({
  title,
  icon,
  accent,
  value,
  meta,
  status,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  value: string;
  meta: string;
  status?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}1a`, color: accent }}>{icon}</span>
          <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
        </div>
        {status && <StatusBadge status={status} dot={false} />}
      </div>
      <p className="mt-4 font-mono text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      <Button asChild variant="outline" className="mt-4 w-full gap-2 rounded-xl">
        <Link href="/dashboard/entry">
          <Plus className="h-4 w-4" /> Add reading
        </Link>
      </Button>
    </div>
  );
}
