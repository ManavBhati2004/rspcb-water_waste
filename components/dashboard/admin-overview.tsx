"use client";

import { useState } from "react";
import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import { ArrowRight, Building2, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/shared/icon";
import { useDataStore, selectMetrics } from "@/lib/store/data";
import { cetps } from "@/lib/data/seed";
import { ALERT_META } from "@/lib/constants";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import type { CetpId } from "@/lib/types";

const CETP_COLORS: Record<string, string> = { balotra: "#6366f1", jasol: "#0ea5e9", bithuja: "#10b981" };

export function AdminOverview() {
  const metrics = useDataStore(useShallow(selectMetrics));
  const alerts = useDataStore((s) => s.alerts);
  const approvals = useDataStore((s) => s.approvals);
  const [activeCetp, setActiveCetp] = useState<CetpId>("balotra");

  const cetp = cetps.find((c) => c.id === activeCetp)!;
  const recentAlerts = alerts.filter((a) => a.status === "active").slice(0, 5);
  const pendingApprovals = approvals.filter((a) => a.stage === "submitted" || a.stage === "verification").slice(0, 5);

  const metricCards = [
    { label: "Total CETPs", value: metrics.totalCetps, icon: "Building2", accent: "#6366f1", delta: { value: "3 live", positive: true } },
    { label: "Total Industries", value: metrics.totalIndustries, icon: "Factory", accent: "#8b5cf6", delta: { value: "+2", positive: true } },
    { label: "Pending Approvals", value: metrics.pendingApprovals, icon: "Clock", accent: "#f59e0b", hint: "Awaiting review" },
    { label: "Rejected Entries", value: metrics.rejectedEntries, icon: "XCircle", accent: "#ef4444", hint: "This cycle" },
    { label: "Non-Reporting", value: metrics.nonReporting, icon: "WifiOff", accent: "#fb923c", hint: "48h+ silent" },
    { label: "Active Alerts", value: metrics.activeAlerts, icon: "BellRing", accent: "#0ea5e9", delta: { value: "live", positive: false } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring Body · Demo session"
        title="Command Center Overview"
        description="A unified, real-time view of CETP treatment, industrial compliance, the alert engine and one-click reports across the Balotra cluster."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* steps summary pipeline */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Treatment Pipeline</h3>
              <p className="text-xs text-muted-foreground">Live flow through each stage</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cetps.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCetp(c.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    activeCetp === c.id ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {c.shortName}
                </button>
              ))}
            </div>
          </div>
          <PipelineFlow flow={cetp.flow} />
        </div>

        {/* right: chart + plant status */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-lg font-bold text-foreground">CETP Performance</h3>
            <p className="text-xs text-muted-foreground">Treated volume vs sanctioned capacity</p>
            <div className="mt-3 space-y-2">
              {cetps.map((c) => {
                const pct = Math.round((c.treatedKLD / c.capacityKLD) * 100);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: CETP_COLORS[c.id] }} />
                      {c.shortName}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                      <span className="hidden sm:inline">Treated <span className="font-mono font-semibold text-foreground">{formatNumber(c.treatedKLD)}</span></span>
                      <span>Cap <span className="font-mono font-semibold text-foreground">{formatNumber(c.capacityKLD)}</span> KLD</span>
                      <span className="font-mono font-semibold" style={{ color: CETP_COLORS[c.id] }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">Plant Status</h3>
              <Link href="/dashboard/cetps" className="text-xs font-semibold text-primary hover:underline">View all</Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {cetps.map((c) => {
                const pct = Math.round((c.treatedKLD / c.capacityKLD) * 100);
                return (
                  <Link key={c.id} href={`/dashboard/cetps/${c.id}`} className="block rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="h-4 w-4 text-primary" /> {c.shortName}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CETP_COLORS[c.id] }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* reports on dashboard */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Reports &amp; Exports</h3>
          <span className="text-xs text-muted-foreground">· generated live from current data</span>
        </div>
        <ReportsPanel />
      </div>

      {/* alerts + approvals */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanel title="Recent Alerts" href="/dashboard/alerts" empty="No active alerts">
          {recentAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${ALERT_META[a.type].color}1f`, color: ALERT_META[a.type].color }}>
                <Icon name={ALERT_META[a.type].icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                  <StatusBadge status={a.severity} dot={false} />
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{a.message}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">{timeAgo(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </ListPanel>

        <ListPanel title="Pending Approvals" href="/dashboard/approvals" empty="All caught up">
          {pendingApprovals.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                <Icon name="Clock" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{a.industryName}</p>
                <p className="text-xs text-muted-foreground">{a.meterPoint} · {formatNumber(a.difference)} {a.unit}</p>
              </div>
              <StatusBadge status={a.stage} dot={false} />
            </div>
          ))}
        </ListPanel>
      </div>
    </div>
  );
}

function ListPanel({ title, href, children, empty }: { title: string; href: string; children: React.ReactNode; empty: string }) {
  const items = Array.isArray(children) ? children : [children];
  const isEmpty = items.flat().filter(Boolean).length === 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 space-y-2.5">{isEmpty ? <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p> : children}</div>
    </div>
  );
}
