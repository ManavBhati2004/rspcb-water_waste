"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calculator, Camera, Check, Clock, ImageOff, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { useDataStore } from "@/lib/store/data";
import { METER_POINTS, READING_TIMES, ALERT_META } from "@/lib/constants";
import type { AlertType, MeterPoint } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";

const schema = z
  .object({
    industryId: z.string().min(1, "Select an industry"),
    date: z.string().min(1, "Date required"),
    readingTime: z.string().min(1),
    meterPoint: z.string().min(1),
    previousReading: z.coerce.number().nonnegative("Must be ≥ 0"),
    currentReading: z.coerce.number().nonnegative("Must be ≥ 0"),
    operatorName: z.string().min(2, "Operator required"),
    inspectorName: z.string().optional().default(""),
    remarks: z.string().optional().default(""),
  })
  .refine((d) => d.currentReading >= d.previousReading, {
    message: "Current reading must be ≥ previous",
    path: ["currentReading"],
  });

type FormValues = z.input<typeof schema>;

function isLateFor(t: string) {
  const [h, m] = t.split(":").map(Number);
  const mins = h * 60 + m;
  if (mins < 12 * 60) return mins > 8 * 60 + 30;
  return mins > 20 * 60 + 30;
}

export default function FlowEntryPage() {
  const industries = useDataStore((s) => s.industries);
  const readings = useDataStore((s) => s.readings);
  const submitReading = useDataStore((s) => s.submitReading);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [success, setSuccess] = useState<null | { alerts: AlertType[]; diff: number; unit: string }>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "2026-06-20", readingTime: "08:00", meterPoint: "Raw Water", previousReading: 0, currentReading: 0 },
  });

  const industryId = watch("industryId");
  const meterPoint = watch("meterPoint") as MeterPoint;
  const readingTime = watch("readingTime");
  const prev = Number(watch("previousReading")) || 0;
  const cur = Number(watch("currentReading")) || 0;
  const difference = cur - prev;
  const unit = meterPoint === "Energy Meter" ? "kWh" : "KL";
  const late = isLateFor(readingTime);
  const industry = industries.find((i) => i.id === industryId);

  // prefill previous reading from latest matching reading + operator
  useEffect(() => {
    if (!industryId) return;
    const last = readings
      .filter((r) => r.industryId === industryId && r.meterPoint === meterPoint)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    if (last) setValue("previousReading", last.currentReading);
    if (industry) setValue("operatorName", industry.contactPerson);
  }, [industryId, meterPoint, readings, setValue, industry]);

  // predicted alerts (mirror store logic)
  const predicted = useMemo(() => {
    const a: AlertType[] = [];
    if (late) a.push("late-submission");
    if (difference === 0 && meterPoint !== "Energy Meter") a.push("zero-reading");
    if (industry && difference > industry.permittedKLD && meterPoint !== "Energy Meter") a.push("capacity-exceeded");
    else if (industry && difference > industry.permittedKLD * 0.85 && meterPoint !== "Energy Meter") a.push("high-flow");
    if (!hasPhoto) a.push("missing-photo");
    return a;
  }, [late, difference, meterPoint, industry, hasPhoto]);

  const onSubmit = handleSubmit((values) => {
    const parsed = schema.parse(values);
    const { alerts } = submitReading({
      industryId: parsed.industryId,
      meterPoint: parsed.meterPoint as MeterPoint,
      date: parsed.date,
      readingTime: parsed.readingTime,
      previousReading: parsed.previousReading,
      currentReading: parsed.currentReading,
      unit: parsed.meterPoint === "Energy Meter" ? "kWh" : "KL",
      hasPhoto,
      operatorName: parsed.operatorName,
      inspectorName: parsed.inspectorName || "—",
      remarks: parsed.remarks || "",
    });
    toast.success("Reading submitted", {
      description: `Sent for verification${alerts.length ? ` · ${alerts.length} alert(s) raised` : ""}.`,
    });
    setSuccess({ alerts, diff: parsed.currentReading - parsed.previousReading, unit });
    setValue("previousReading", parsed.currentReading);
    setValue("currentReading", parsed.currentReading);
    setHasPhoto(false);
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/flow-monitoring" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Flow Monitoring
      </Link>
      <PageHeader
        eyebrow="Digital Logbook"
        title="Flow Meter Entry"
        description="Record a meter reading at 08:00 AM or 08:00 PM. Late entries are accepted and flagged. Difference is auto-calculated."
      />

      <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          {/* Reading details */}
          <SectionTitle>Reading Details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry" error={errors.industryId?.message}>
              <select {...register("industryId")} className={inputCls} defaultValue="">
                <option value="" disabled>Select industry…</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Date" error={errors.date?.message}>
              <input type="date" {...register("date")} className={inputCls} />
            </Field>
            <Field label="Meter Point" error={errors.meterPoint?.message}>
              <select {...register("meterPoint")} className={inputCls}>
                {METER_POINTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
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

          {/* Meter reading */}
          <SectionTitle>Meter Reading</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`Previous Reading (${unit})`} error={errors.previousReading?.message}>
              <input type="number" step="any" {...register("previousReading")} className={inputCls} />
            </Field>
            <Field label={`Current Reading (${unit})`} error={errors.currentReading?.message}>
              <input type="number" step="any" {...register("currentReading")} className={inputCls} />
            </Field>
            <Field label="Difference (auto)">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 font-mono text-sm font-bold text-primary">
                <Calculator className="h-4 w-4" />
                {formatNumber(difference)} {unit}
              </div>
            </Field>
          </div>

          {/* Verification */}
          <SectionTitle>Verification</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Operator Name" error={errors.operatorName?.message}>
              <input {...register("operatorName")} className={inputCls} placeholder="On-site operator" />
            </Field>
            <Field label="Inspector Name">
              <input {...register("inspectorName")} className={inputCls} placeholder="RSPCB inspector (optional)" />
            </Field>
          </div>
          <Field label="Remarks">
            <textarea {...register("remarks")} rows={2} className={cn(inputCls, "h-auto resize-none py-2")} placeholder="Notes about this reading…" />
          </Field>

          {/* photo */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Photo Upload</label>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors",
                hasPhoto ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-primary/40",
              )}
            >
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setHasPhoto(!!e.target.files?.length)} />
              <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-lg", hasPhoto ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>
                {hasPhoto ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{hasPhoto ? "Photo attached" : "Attach meter photo"}</p>
                <p className="text-xs text-muted-foreground">{hasPhoto ? "Click to replace" : "Demo — any image, not uploaded"}</p>
              </div>
            </label>
          </div>
        </div>

        {/* live summary */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-foreground">Live Summary</h3>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{industry?.name ?? "No industry selected"}</p>
              <p className="mt-1 font-mono text-3xl font-bold text-primary">
                {formatNumber(difference)} <span className="text-base font-medium text-muted-foreground">{unit}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {readingTime}</span>
                {late ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-400">Late entry</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-400">On time</span>
                )}
              </div>
              {industry && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Permitted: <span className="font-semibold text-foreground">{formatNumber(industry.permittedKLD)} KLD</span>
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Alerts on submit</p>
              {predicted.length === 0 ? (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-400">
                  <Check className="h-4 w-4" /> No alerts — clean reading
                </p>
              ) : (
                <div className="space-y-1.5">
                  {predicted.map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs" style={{ color: ALERT_META[t].color }}>
                      {t === "missing-photo" ? <ImageOff className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
                      <span className="font-medium">{ALERT_META[t].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 rounded-xl text-base font-semibold">
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting…" : "Submit Reading"}
            </Button>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="h-5 w-5" />
                  <p className="font-semibold">Submitted for verification</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Difference {formatNumber(success.diff)} {success.unit} recorded. Track it in{" "}
                  <Link href="/dashboard/approvals" className="font-semibold text-primary hover:underline">Approvals</Link>.
                </p>
                {success.alerts.length > 0 && (
                  <p className="mt-2 text-xs text-amber-400">{success.alerts.length} alert(s) raised in the alert center.</p>
                )}
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
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b border-border pb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">{children}</h3>;
}
