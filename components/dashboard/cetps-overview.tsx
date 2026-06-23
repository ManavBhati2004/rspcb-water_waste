"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Users, Gauge, Recycle, Factory } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { cetps } from "@/lib/data/seed";
import { useDataStore } from "@/lib/store/data";
import { formatNumber } from "@/lib/utils";

const ACCENT: Record<string, string> = { balotra: "#22d3ee", jasol: "#60a5fa", bithuja: "#34d399" };

export function CetpsOverview() {
  const industries = useDataStore((s) => s.industries);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Common Effluent Treatment Plants"
        description="Enter any plant to watch its live treatment pipeline, recovery and connected industries."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {cetps.map((cetp, i) => {
          const accent = ACCENT[cetp.id];
          const pct = Math.round((cetp.treatedKLD / cetp.capacityKLD) * 100);
          const connected = industries.filter((ind) => ind.cetpId === cetp.id).length;
          return (
            <motion.div
              key={cetp.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/dashboard/cetps/${cetp.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl sm:p-6"
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
                />
                <div className="flex items-start justify-between">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}
                  >
                    <Building2 className="h-6 w-6" />
                  </span>
                  <StatusBadge status={cetp.status} />
                </div>

                <h3 className="mt-4 font-display text-xl font-bold text-foreground">{cetp.name}</h3>
                <p className="text-sm text-muted-foreground">{cetp.location}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Stat icon={<Gauge className="h-4 w-4" />} label="Capacity" value={`${formatNumber(cetp.capacityKLD)} KLD`} />
                  <Stat icon={<Recycle className="h-4 w-4" />} label="Recovery" value={`${cetp.recoveryRate}%`} />
                  <Stat icon={<Users className="h-4 w-4" />} label="Members" value={formatNumber(cetp.members)} />
                  <Stat icon={<Factory className="h-4 w-4" />} label="Monitored" value={`${connected} units`} />
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-mono font-semibold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span className="font-display text-2xl font-bold" style={{ color: accent }}>
                      {cetp.complianceScore}%
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground">compliance</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Enter plant
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-display text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
