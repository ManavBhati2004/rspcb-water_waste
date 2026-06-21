"use client";

import { Zap, Activity, Gauge, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MultiLineTrend, DonutBreakdown } from "@/components/charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { energy } from "@/lib/data/seed";
import { formatNumber, compactNumber, cn } from "@/lib/utils";

const STAGE_COLORS = ["#22d3ee", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"];

export default function EnergyPage() {
  const totalKWh = energy.lines.reduce((s, l) => s + l.consumptionKWh, 0);
  const totalKVA = energy.lines.reduce((s, l) => s + l.demandKVA, 0);
  const avgPF = (energy.lines.reduce((s, l) => s + l.powerFactor, 0) / energy.lines.length).toFixed(2);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Energy Monitoring"
        description="Live power flow and consumption across the CETP 11 KV feeders and ZLD 33 KV lines driving treatment & recovery."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Zap className="h-4 w-4" />} label="Total Consumption" value={`${compactNumber(totalKWh)} kWh`} accent="#22d3ee" />
        <Stat icon={<Gauge className="h-4 w-4" />} label="Peak Demand" value={`${compactNumber(totalKVA)} kVA`} accent="#fbbf24" />
        <Stat icon={<Activity className="h-4 w-4" />} label="Avg Power Factor" value={avgPF} accent="#34d399" />
        <Stat icon={<PlugZap className="h-4 w-4" />} label="Active Feeders" value={`${energy.lines.length}`} accent="#60a5fa" />
      </div>

      {/* power flow */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold text-foreground">Power Flow</h3>
        <p className="text-xs text-muted-foreground">Grid → feeder → treatment load</p>
        <div className="mt-5 space-y-5">
          {[
            { label: "CETP 11 KV Line", color: "#22d3ee", load: "Treatment Load" },
            { label: "ZLD 33 KV Line", color: "#fbbf24", load: "ZLD / MEE Load" },
          ].map((line) => (
            <div key={line.label} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <FlowNodeBox label="Grid" sub="Supply" color={line.color} />
              <PowerLine color={line.color} label={line.label} />
              <FlowNodeBox label={line.load} sub={line.label} color={line.color} highlight />
            </div>
          ))}
        </div>
      </div>

      {/* feeders */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {energy.lines.map((l) => (
          <div key={l.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-bold text-foreground">{l.name}</p>
                <span className="mt-1 inline-block rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-400">{l.voltage}</span>
              </div>
              <StatusBadge status={l.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Metric label="kWh" value={formatNumber(l.consumptionKWh)} />
              <Metric label="kVA" value={formatNumber(l.demandKVA)} />
              <Metric label="PF" value={l.powerFactor.toFixed(2)} />
            </div>
          </div>
        ))}
      </div>

      {/* charts */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold text-foreground">Daily Consumption</h3>
          <p className="text-xs text-muted-foreground">11 KV vs 33 KV lines (kWh)</p>
          <div className="mt-4">
            <MultiLineTrend
              data={energy.dailyTrend}
              height={280}
              lines={[
                { key: "kv11", color: "#22d3ee", label: "11 KV" },
                { key: "kv33", color: "#fbbf24", label: "33 KV" },
              ]}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold text-foreground">By Stage</h3>
          <p className="text-xs text-muted-foreground">Consumption share (%)</p>
          <DonutBreakdown data={energy.consumptionByStage} colors={STAGE_COLORS} height={210} />
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {energy.consumptionByStage.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[i] }} />
                {s.label} · {s.value}%
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PowerLine({ color, label }: { color: string; label: string }) {
  return (
    <div className="relative flex-1">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full" style={{ background: `${color}22` }}>
        <div
          className="absolute inset-0 motion-safe:animate-[flow-x_1s_linear_infinite]"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, ${color}00 0, ${color}cc 8px, ${color}00 16px)`, backgroundSize: "26px 100%" }}
        />
        {[0, 0.4, 0.8].map((d, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full motion-safe:animate-[flow-x_1.4s_linear_infinite]"
            style={{ background: color, boxShadow: `0 0 8px ${color}`, animationDelay: `${d}s` }}
          />
        ))}
      </div>
      <span className="mt-1 block text-center text-[10px] font-medium uppercase tracking-wide" style={{ color }}>{label}</span>
    </div>
  );
}

function FlowNodeBox({ label, sub, color, highlight }: { label: string; sub: string; color: string; highlight?: boolean }) {
  return (
    <div
      className={cn("flex min-w-24 flex-col items-center justify-center rounded-xl border px-3 py-2.5 text-center", highlight ? "" : "border-border bg-muted/30")}
      style={highlight ? { borderColor: `${color}55`, background: `${color}12` } : undefined}
    >
      <Zap className="h-4 w-4" style={{ color }} />
      <span className="mt-1 text-xs font-semibold text-foreground">{label}</span>
      <span className="text-[9px] text-muted-foreground">{sub}</span>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}1f`, color: accent }}>{icon}</span>
      <p className="mt-3 font-display text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 py-2">
      <p className="font-mono text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
