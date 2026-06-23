"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Check, Send, Droplets, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import type { AlertType } from "@/lib/types";
import { ALERT_META } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const schema = z.object({
  date: z.string().min(1, "Date required"),
  freshWaterConsumption: z.coerce.number().nonnegative("Must be ≥ 0"),
  etpInlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  etpOutlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  etpReuse: z.coerce.number().nonnegative("Must be ≥ 0"),
  roInlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  roReject: z.coerce.number().nonnegative("Must be ≥ 0"),
  roPermeate: z.coerce.number().nonnegative("Must be ≥ 0"),
  sludgeToTSDF: z.coerce.number().nonnegative("Must be ≥ 0"),
});

type FormValues = z.input<typeof schema>;

const FIELDS: { name: keyof FormValues; label: string }[] = [
  { name: "freshWaterConsumption", label: "Fresh Water Consumption" },
  { name: "etpInlet", label: "ETP Inlet" },
  { name: "etpOutlet", label: "ETP Outlet" },
  { name: "etpReuse", label: "ETP Reuse" },
  { name: "roInlet", label: "RO Inlet" },
  { name: "roReject", label: "RO Reject" },
  { name: "roPermeate", label: "RO Permeate" },
  { name: "sludgeToTSDF", label: "Sludge sent to TSDF" },
];

export default function EtpEntryPage() {
  const industryId = useAuthStore((s) => s.industryId);
  const industries = useDataStore((s) => s.industries);
  const submitEtpEntry = useDataStore((s) => s.submitEtpEntry);
  const industry = industries.find((i) => i.id === industryId);
  const [success, setSuccess] = useState<null | { total: number; alerts: AlertType[] }>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "2026-06-20",
      freshWaterConsumption: 0,
      etpInlet: 0,
      etpOutlet: 0,
      etpReuse: 0,
      roInlet: 0,
      roReject: 0,
      roPermeate: 0,
      sludgeToTSDF: 0,
    },
  });

  const fresh = Number(watch("freshWaterConsumption")) || 0;
  const reuse = Number(watch("etpReuse")) || 0;
  const permeate = Number(watch("roPermeate")) || 0;
  const totalWaterIntake = fresh + reuse + permeate;

  const predicted: AlertType[] = [];
  if (totalWaterIntake === 0) predicted.push("zero-reading");
  if (industry && totalWaterIntake > industry.permittedKLD) predicted.push("capacity-exceeded");
  else if (industry && totalWaterIntake > industry.permittedKLD * 0.85) predicted.push("high-flow");

  const onSubmit = handleSubmit((values) => {
    if (!industryId) return;
    const v = schema.parse(values);
    const { entry, alerts } = submitEtpEntry({
      industryId,
      date: v.date,
      freshWaterConsumption: v.freshWaterConsumption,
      etpInlet: v.etpInlet,
      etpOutlet: v.etpOutlet,
      etpReuse: v.etpReuse,
      roInlet: v.roInlet,
      roReject: v.roReject,
      roPermeate: v.roPermeate,
      sludgeToTSDF: v.sludgeToTSDF,
    });
    toast.success("Water-balance entry submitted", {
      description: `Total intake ${formatNumber(entry.totalWaterIntake)} KL · sent for verification${alerts.length ? ` · ${alerts.length} alert(s)` : ""}.`,
    });
    setSuccess({ total: entry.totalWaterIntake, alerts });
  });

  if (!industry) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">No ETP unit linked to this session</p>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Sign in or register your unit</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${industry.name} · ETP Logbook`}
        title="ETP Water-Balance Entry"
        description="Record today's water balance. All values are in kilolitres (KL). Total Water Intake is auto-calculated and sent for verification."
      />

      <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <SectionTitle icon={<Droplets className="h-4 w-4" />}>Daily Water Balance (KL)</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" error={errors.date?.message}>
              <input type="date" {...register("date")} className={inputCls} />
            </Field>
            <div className="hidden sm:block" />
            {FIELDS.map((f) => (
              <Field key={f.name} label={`${f.label} (KL)`} error={errors[f.name]?.message}>
                <input type="number" step="any" {...register(f.name)} className={inputCls} placeholder="0" />
              </Field>
            ))}
            <Field label="Total Water Intake (KL · auto)">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 font-mono text-sm font-bold text-primary">
                <Calculator className="h-4 w-4" />
                {formatNumber(totalWaterIntake)} KL
              </div>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Total Water Intake = Fresh Water Consumption + ETP Reuse + RO Permeate. This field is non-editable.
          </p>
        </div>

        {/* summary */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-foreground">Total Water Intake</h3>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="font-mono text-3xl font-bold text-primary">
                {formatNumber(totalWaterIntake)} <span className="text-base font-medium text-muted-foreground">KL</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Fresh {formatNumber(fresh)} + Reuse {formatNumber(reuse)} + Permeate {formatNumber(permeate)} KL</p>
              {industry && <p className="mt-2 text-xs text-muted-foreground">Permitted: <span className="font-semibold text-foreground">{formatNumber(industry.permittedKLD)} KLD</span></p>}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Alerts on submit</p>
              {predicted.length === 0 ? (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-600">
                  <Check className="h-4 w-4" /> No alerts — clean entry
                </p>
              ) : (
                <div className="space-y-1.5">
                  {predicted.map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs" style={{ color: ALERT_META[t].color }}>
                      <TriangleAlert className="h-3.5 w-3.5" />
                      <span className="font-medium">{ALERT_META[t].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 rounded-xl text-base font-semibold">
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting…" : "Submit Water Balance"}
            </Button>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-5 w-5" />
                  <p className="font-semibold">Submitted for verification</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Total Water Intake {formatNumber(success.total)} KL recorded. Track it in{" "}
                  <span className="font-semibold text-foreground">your dashboard</span>.
                </p>
                {success.alerts.length > 0 && <p className="mt-2 text-xs text-amber-500">{success.alerts.length} alert(s) raised.</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 border-b border-border pb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
      {icon && <span className="text-primary">{icon}</span>}
      {children}
    </h3>
  );
}
