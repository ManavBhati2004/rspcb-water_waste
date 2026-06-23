"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2, ChevronRight, ArrowLeft, Download, ClipboardList, Recycle, Droplets } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineFlow } from "@/components/dashboard/pipeline-flow";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/store/data";
import { buildCetpFlow } from "@/lib/data/cetp-flow";
import { formatNumber, formatDate } from "@/lib/utils";
import type { CetpEntry, Industry } from "@/lib/types";

export default function CetpEntriesPage() {
  const industries = useDataStore((s) => s.industries);
  const cetpEntries = useDataStore((s) => s.cetpEntries);
  const cetpUnits = industries.filter((i) => i.cetpId && !i.isIndividualETP);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const latestByIndustry = useMemo(() => {
    const map: Record<string, CetpEntry | undefined> = {};
    for (const e of [...cetpEntries].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))) {
      map[e.industryId] = e; // last write wins → latest
    }
    return map;
  }, [cetpEntries]);

  const selected = selectedId ? cetpUnits.find((i) => i.id === selectedId) ?? null : null;

  if (selected) {
    return <CetpDetail ind={selected} entries={cetpEntries} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="CETP Data"
        description="CETP-connected industries and the daily data they file. Select a unit to view its reading history, data flow and report."
      />

      {cetpUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No CETP-connected industries.
        </div>
      ) : (
        <div className="space-y-2.5">
          {cetpUnits.map((ind) => {
            const latest = latestByIndustry[ind.id];
            const count = cetpEntries.filter((e) => e.industryId === ind.id).length;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedId(ind.id)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold text-foreground">{ind.name}</h3>
                    {ind.cetpId && (
                      <span className="hidden rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium capitalize text-violet-500 sm:inline">
                        {ind.cetpId}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{ind.area}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StatusBadge status={ind.status} />
                    <span className="text-xs text-muted-foreground">{count} entr{count === 1 ? "y" : "ies"}</span>
                    <span className="text-xs text-muted-foreground">Last: {latest ? formatDate(latest.date) : "—"}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CetpDetail({ ind, entries, onBack }: { ind: Industry; entries: CetpEntry[]; onBack: () => void }) {
  const mine = useMemo(
    () => entries.filter((e) => e.industryId === ind.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [entries, ind.id],
  );
  const latest = mine[0];

  const columns: ColumnDef<CetpEntry>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span className="whitespace-nowrap text-sm text-foreground">{formatDate(row.original.date)}</span> },
    { accessorKey: "inlet", header: "Inlet", cell: ({ row }) => <Num v={row.original.inlet} /> },
    { accessorKey: "tertiaryOutlet", header: "Tertiary Outlet", cell: ({ row }) => <Num v={row.original.tertiaryOutlet} /> },
    { accessorKey: "roInlet", header: "RO Inlet", cell: ({ row }) => <Num v={row.original.roInlet} /> },
    { accessorKey: "meeInlet", header: "MEE Inlet", cell: ({ row }) => <Num v={row.original.meeInlet} unit="KL" /> },
    { accessorKey: "zldOutlet", header: "ZLD Outlet", cell: ({ row }) => <Num v={row.original.zldOutlet} unit="KL" /> },
    { accessorKey: "zldOutletTSS", header: "ZLD TSS", cell: ({ row }) => <Num v={row.original.zldOutletTSS} /> },
    { accessorKey: "sepInlet", header: "SEP Inlet", cell: ({ row }) => <Num v={row.original.sepInlet} unit="KL" /> },
    { accessorKey: "sepInletTSS", header: "SEP TSS", cell: ({ row }) => <Num v={row.original.sepInletTSS} /> },
    { accessorKey: "roPermeate", header: "RO Permeate", cell: ({ row }) => <Num v={row.original.roPermeate} /> },
  ];

  const handleDownload = () => {
    if (!mine.length) return;
    const rows = mine.map((e) => ({
      Date: e.date,
      Inlet: e.inlet,
      "Tertiary Outlet": e.tertiaryOutlet,
      "RO Inlet": e.roInlet,
      "MEE Inlet (KL)": e.meeInlet,
      "ZLD Outlet (KL)": e.zldOutlet,
      "ZLD Outlet TSS": e.zldOutletTSS,
      "SEP Inlet (KL)": e.sepInlet,
      "SEP Inlet TSS": e.sepInletTSS,
      "RO Permeate": e.roPermeate,
      "Submitted At": e.submittedAt,
    }));
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    download(`jalrakshak-cetp-${ind.id}-${today}.csv`, toCSV(rows));
    toast.success("CETP report exported", { description: `${rows.length} entr${rows.length === 1 ? "y" : "ies"} · ${ind.name}` });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All CETP Units
      </button>

      {/* header */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
          <Building2 className="h-5 w-5" />
        </span>
        <h3 className="mt-3 font-display text-lg font-bold text-foreground">{ind.name}</h3>
        <p className="text-sm text-muted-foreground">{ind.area}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={ind.status} />
          {ind.cetpId && <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium capitalize text-violet-500">{ind.cetpId} CETP</span>}
          <span className="text-xs text-muted-foreground">Permitted {formatNumber(ind.permittedKLD)} KLD</span>
        </div>
      </div>

      {/* RO reject routing (latest) */}
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
          <h3 className="font-display text-lg font-bold text-foreground">Water Treatment Pipeline</h3>
        </div>
        {latest ? (
          <PipelineFlow flow={buildCetpFlow(latest)} />
        ) : (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No entries filed yet.</div>
        )}
      </div>

      {/* history & report */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" /> Reading History &amp; Report
            </h3>
            <p className="text-sm text-muted-foreground">Every data entry filed by this unit (no verification step).</p>
          </div>
          <Button onClick={handleDownload} disabled={mine.length === 0} variant="outline" className="h-10 shrink-0 gap-2 rounded-xl">
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
        <div className="mt-5">
          <DataTable columns={columns} data={mine} searchPlaceholder="Search entries…" pageSize={8} emptyMessage="No entries filed yet." />
        </div>
      </div>
    </div>
  );
}

function Num({ v, unit }: { v: number; unit?: string }) {
  return (
    <span className="whitespace-nowrap font-mono text-sm text-foreground">
      {formatNumber(v)}
      {unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
    </span>
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

/* ---- local CSV helpers (same as the Reports panel) ---- */
function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "No data";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
