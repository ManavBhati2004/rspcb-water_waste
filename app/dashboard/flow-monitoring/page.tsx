"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Waves, Clock, TrendingUp, Gauge } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/store/data";
import { METER_POINTS } from "@/lib/constants";
import type { FlowMeterReading } from "@/lib/types";
import { formatNumber, formatDate, cn } from "@/lib/utils";

export default function FlowMonitoringPage() {
  const readings = useDataStore((s) => s.readings);

  const sorted = useMemo(() => [...readings].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [readings]);

  const stats = useMemo(() => {
    const today = "2026-06-20";
    return {
      total: readings.length,
      today: readings.filter((r) => r.date === today).length,
      late: readings.filter((r) => r.isLate).length,
      pending: readings.filter((r) => r.status === "pending").length,
    };
  }, [readings]);

  const columns: ColumnDef<FlowMeterReading>[] = [
    {
      accessorKey: "industryName",
      header: "Industry",
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.industryName}</span>,
    },
    {
      accessorKey: "meterPoint",
      header: "Meter Point",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.meterPoint}</span>,
    },
    {
      accessorKey: "submittedAt",
      header: "Date / Time",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{formatDate(row.original.date)}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.original.readingTime}</span>
          {row.original.isLate && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">Late</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "difference",
      header: "Difference",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          {formatNumber(row.original.difference)} <span className="text-xs font-normal text-muted-foreground">{row.original.unit}</span>
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Flow Monitoring"
        description="Digital logbook of every flow-meter reading across CETPs and individual ETPs — auto-calculated and verification-ready."
        actions={
          <Button asChild className="h-10 gap-2 rounded-xl">
            <Link href="/dashboard/flow-monitoring/entry">
              <Plus className="h-4 w-4" /> New Entry
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Gauge className="h-4 w-4" />} label="Total Readings" value={stats.total} accent="#22d3ee" />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Today" value={stats.today} accent="#34d399" />
        <Stat icon={<Clock className="h-4 w-4" />} label="Late Entries" value={stats.late} accent="#fbbf24" />
        <Stat icon={<Waves className="h-4 w-4" />} label="Pending" value={stats.pending} accent="#f472b6" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Flow Meter Types (at CETP)</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {METER_POINTS.map((p) => (
            <span key={p} className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
              {p}
            </span>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={sorted} searchPlaceholder="Search readings…" pageSize={10} />
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}1f`, color: accent }}>
        {icon}
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
