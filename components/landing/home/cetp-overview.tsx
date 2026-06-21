"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Users, Gauge, Factory, Recycle } from "lucide-react";
import { cetps } from "@/lib/data/seed";
import { formatNumber } from "@/lib/utils";
import { SectionReveal } from "@/components/shared/section-reveal";

const ACCENTS: Record<string, { from: string; to: string; ring: string }> = {
  balotra: { from: "#0d9488", to: "#06b6d4", ring: "ring-teal-400/40" },
  jasol: { from: "#0ea5e9", to: "#2563eb", ring: "ring-sky-400/40" },
  bithuja: { from: "#059669", to: "#10b981", ring: "ring-emerald-400/40" },
};

export function CetpOverview() {
  return (
    <section id="cetps" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <SectionReveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Common Effluent Treatment Plants</span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Three CETPs. One transparent network.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Real-time recovery, compliance and member monitoring across the Balotra
          textile cluster — Balotra, Jasol and Bithuja.
        </p>
      </SectionReveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {cetps.map((cetp, i) => {
          const a = ACCENTS[cetp.id];
          return (
            <motion.div
              key={cetp.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className={`group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-2xl hover:ring-1 ${a.ring}`}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: `radial-gradient(circle, ${a.to}, transparent 70%)` }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                  >
                    <Factory className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold text-foreground">{cetp.name}</h3>
                  <p className="text-sm text-muted-foreground">{cetp.location}</p>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold" style={{ color: a.from }}>
                    {cetp.complianceScore}%
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Compliance</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
                <Stat icon={<Gauge className="h-4 w-4" />} value={`${formatNumber(cetp.capacityKLD / 1000)}k`} label="KLD" />
                <Stat icon={<Users className="h-4 w-4" />} value={formatNumber(cetp.members)} label="Members" />
                <Stat icon={<Recycle className="h-4 w-4" />} value={`${cetp.recoveryRate}%`} label="Recovery" />
              </div>

              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline"
              >
                Explore plant
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-center text-muted-foreground">{icon}</div>
      <div className="mt-1 font-display text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
