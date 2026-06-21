"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Camera, Check, Clock, Send, Waves, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import { READING_TIMES } from "@/lib/constants";
import type { AlertType } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";

const schema = z
  .object({
    date: z.string().min(1, "Date required"),
    readingTime: z.string().min(1),
    flowPrev: z.coerce.number().nonnegative(),
    flowCur: z.coerce.number().nonnegative(),
    energyPrev: z.coerce.number().nonnegative(),
    energyCur: z.coerce.number().nonnegative(),
    operatorName: z.string().min(2, "Operator required"),
    remarks: z.string().optional().default(""),
  })
  .refine((d) => d.flowCur >= d.flowPrev, { message: "Current ≥ previous", path: ["flowCur"] })
  .refine((d) => d.energyCur >= d.energyPrev, { message: "Current ≥ previous", path: ["energyCur"] });

type FormValues = z.input<typeof schema>;

function isLateFor(t: string) {
  const [h, m] = t.split(":").map(Number);
  const mins = h * 60 + m;
  if (mins < 12 * 60) return mins > 8 * 60 + 30;
  return mins > 20 * 60 + 30;
}

export default function DailyEntryPage() {
  const industryId = useAuthStore((s) => s.industryId);
  const industries = useDataStore((s) => s.industries);
  const readings = useDataStore((s) => s.readings);
  const submitReading = useDataStore((s) => s.submitReading);
  const industry = industries.find((i) => i.id === industryId);

  const [hasPhoto, setHasPhoto] = useState(false);
  const [success, setSuccess] = useState<null | { flow: number; energy: number; alerts: AlertType[] }>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "2026-06-20", readingTime: "08:00", flowPrev: 0, flowCur: 0, energyPrev: 0, energyCur: 0 },
  });

  const readingTime = watch("readingTime");
  const flowDiff = (Number(watch("flowCur")) || 0) - (Number(watch("flowPrev")) || 0);
  const energyDiff = (Number(watch("energyCur")) || 0) - (Number(watch("energyPrev")) || 0);
  const late = isLateFor(readingTime);

  useEffect(() => {
    if (!industryId) return;
    const lastFlow = readings.filter((r) => r.industryId === industryId && r.meterPoint === "Raw Water").sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    const lastEnergy = readings.filter((r) => r.industryId === industryId && r.meterPoint === "Energy Meter").sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    if (lastFlow) setValue("flowPrev", lastFlow.currentReading);
    if (lastEnergy) setValue("energyPrev", lastEnergy.currentReading);
    if (industry) setValue("operatorName", industry.contactPerson);
  }, [industryId, readings, setValue, industry]);

  const onSubmit = handleSubmit((values) => {
    if (!industryId) return;
    const parsed = schema.parse(values);
    const flow = submitReading({
      industryId,
      meterPoint: "Raw Water",
      date: parsed.date,
      readingTime: parsed.readingTime,
      previousReading: parsed.flowPrev,
      currentReading: parsed.flowCur,
      unit: "KL",
      hasPhoto,
      operatorName: parsed.operatorName,
      inspectorName: "—",
      remarks: parsed.remarks || "",
    });
    const energy = submitReading({
      industryId,
      meterPoint: "Energy Meter",
      date: parsed.date,
      readingTime: parsed.readingTime,
      previousReading: parsed.energyPrev,
      currentReading: parsed.energyCur,
      unit: "kWh",
      hasPhoto,
      operatorName: parsed.operatorName,
      inspectorName: "—",
      remarks: parsed.remarks || "",
    });
    const allAlerts = Array.from(new Set([...flow.alerts, ...energy.alerts]));
    toast.success("Daily entry submitted", { description: `Flow + energy sent for verification${allAlerts.length ? ` · ${allAlerts.length} alert(s)` : ""}.` });
    setSuccess({ flow: flow.reading.difference, energy: energy.reading.difference, alerts: allAlerts });
    setValue("flowPrev", parsed.flowCur);
    setValue("energyPrev", parsed.energyCur);
    setHasPhoto(false);
  });

  if (!industry) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">No unit linked to this session</p>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Sign in and pick your unit</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${industry.name} · Digital Logbook`}
        title="Daily Data Entry"
        description="Record today's flow-meter reading and energy consumption. The difference is auto-calculated and sent for verification."
      />

      <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {/* timing */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <SectionTitle>When</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" error={errors.date?.message}>
                <input type="date" {...register("date")} className={inputCls} />
              </Field>
              <Field label="Reading Time">
                <div className="flex gap-2">
                  {READING_TIMES.map((t) => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setValue("readingTime", t.value)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                        readingTime === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {t.value === "08:00" ? "08:00 AM" : "08:00 PM"}
                    </button>
                  ))}
                  <input type="time" {...register("readingTime")} className={cn(inputCls, "w-28")} />
                </div>
              </Field>
            </div>
          </div>

          {/* flow meter */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <SectionTitle icon={<Waves className="h-4 w-4" />}>Flow Meter Reading (KL)</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Previous" error={errors.flowPrev?.message}>
                <input type="number" step="any" {...register("flowPrev")} className={inputCls} />
              </Field>
              <Field label="Current" error={errors.flowCur?.message}>
                <input type="number" step="any" {...register("flowCur")} className={inputCls} />
              </Field>
              <Field label="Difference">
                <Diff value={flowDiff} unit="KL" />
              </Field>
            </div>
          </div>

          {/* energy */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <SectionTitle icon={<Zap className="h-4 w-4" />}>Energy Consumption (kWh)</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Previous" error={errors.energyPrev?.message}>
                <input type="number" step="any" {...register("energyPrev")} className={inputCls} />
              </Field>
              <Field label="Current" error={errors.energyCur?.message}>
                <input type="number" step="any" {...register("energyCur")} className={inputCls} />
              </Field>
              <Field label="Difference">
                <Diff value={energyDiff} unit="kWh" />
              </Field>
            </div>
          </div>

          {/* verification */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <SectionTitle>Verification</SectionTitle>
            <div className="grid gap-4">
              <Field label="Operator Name" error={errors.operatorName?.message}>
                <input {...register("operatorName")} className={inputCls} placeholder="On-site operator" />
              </Field>
              <Field label="Remarks">
                <textarea {...register("remarks")} rows={2} className={cn(inputCls, "h-auto resize-none py-2")} placeholder="Notes…" />
              </Field>
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors", hasPhoto ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-primary/40")}>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setHasPhoto(!!e.target.files?.length)} />
                <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-lg", hasPhoto ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground")}>
                  {hasPhoto ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{hasPhoto ? "Photo attached" : "Attach meter photo"}</p>
                  <p className="text-xs text-muted-foreground">Demo — any image, not uploaded</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* summary */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-foreground">Today&apos;s Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <SumTile label="Flow" value={`${formatNumber(flowDiff)}`} unit="KL" accent="#6366f1" />
              <SumTile label="Energy" value={`${formatNumber(energyDiff)}`} unit="kWh" accent="#8b5cf6" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{readingTime}</span>
              {late ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-500">Late entry</span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-500">On time</span>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 rounded-xl text-base font-semibold">
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting…" : "Submit Daily Entry"}
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
                  Flow {formatNumber(success.flow)} KL · Energy {formatNumber(success.energy)} kWh recorded.
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
    <h3 className="mb-3 flex items-center gap-2 border-b border-border pb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
      {icon && <span className="text-primary">{icon}</span>}
      {children}
    </h3>
  );
}

function Diff({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 font-mono text-sm font-bold text-primary">
      <Calculator className="h-4 w-4" />
      {formatNumber(value)} {unit}
    </div>
  );
}

function SumTile({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-xl font-bold" style={{ color: accent }}>
        {value} <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
