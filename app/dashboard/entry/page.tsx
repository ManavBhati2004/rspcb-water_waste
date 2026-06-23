"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Send, Check, Waves, Recycle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import { formatNumber, formatDate } from "@/lib/utils";

const schema = z.object({
  date: z.string().min(1, "Date required"),
  inlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  tertiaryOutlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  roInlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  meeInlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  zldOutlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  zldOutletTSS: z.coerce.number().nonnegative("Must be ≥ 0"),
  sepInlet: z.coerce.number().nonnegative("Must be ≥ 0"),
  sepInletTSS: z.coerce.number().nonnegative("Must be ≥ 0"),
  roPermeate: z.coerce.number().nonnegative("Must be ≥ 0"),
});

type FormValues = z.input<typeof schema>;

// Flow readings — no unit (per spec, only RO Reject carries a unit).
const FLOW_FIELDS: { name: keyof FormValues; label: string }[] = [
  { name: "inlet", label: "Inlet" },
  { name: "tertiaryOutlet", label: "Tertiary Outlet" },
  { name: "roInlet", label: "RO Inlet" },
  { name: "roPermeate", label: "RO Permeate" },
];

export default function CetpEntryPage() {
  const industryId = useAuthStore((s) => s.industryId);
  const industries = useDataStore((s) => s.industries);
  const submitCetpEntry = useDataStore((s) => s.submitCetpEntry);
  const industry = industries.find((i) => i.id === industryId);
  const [today, setToday] = useState("");
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "",
      inlet: 0,
      tertiaryOutlet: 0,
      roInlet: 0,
      meeInlet: 0,
      zldOutlet: 0,
      zldOutletTSS: 0,
      sepInlet: 0,
      sepInletTSS: 0,
      roPermeate: 0,
    },
  });

  // Lock the date to today's local calendar date (post-mount → hydration-safe).
  useEffect(() => {
    const n = new Date();
    const d = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    setToday(d);
    setValue("date", d);
  }, [setValue]);

  const inlet = Number(watch("inlet")) || 0;
  const permeate = Number(watch("roPermeate")) || 0;
  const rejectTotal = (Number(watch("meeInlet")) || 0) + (Number(watch("zldOutlet")) || 0) + (Number(watch("sepInlet")) || 0);

  const onSubmit = handleSubmit((values) => {
    if (!industryId) return;
    const v = schema.parse(values);
    const { entry } = submitCetpEntry({
      industryId,
      date: v.date,
      inlet: v.inlet,
      tertiaryOutlet: v.tertiaryOutlet,
      roInlet: v.roInlet,
      meeInlet: v.meeInlet,
      zldOutlet: v.zldOutlet,
      zldOutletTSS: v.zldOutletTSS,
      sepInlet: v.sepInlet,
      sepInletTSS: v.sepInletTSS,
      roPermeate: v.roPermeate,
    });
    toast.success("Entry recorded", { description: `${formatDate(entry.date)} · saved to your CETP logbook.` });
    setDone(true);
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
        eyebrow={`${industry.name} · CETP Logbook`}
        title="CETP Data Entry"
        description="Record today's flow readings. The date is locked to today and entries are saved directly — no verification needed."
      />

      <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {/* flow readings */}
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <SectionTitle icon={<Waves className="h-4 w-4" />}>Flow Readings</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date (today · locked)">
                <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm text-foreground">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{today ? formatDate(today) : "…"}</span>
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Today</span>
                </div>
                <input type="hidden" {...register("date")} />
              </Field>
              <div className="hidden sm:block" />
              {FLOW_FIELDS.map((f) => (
                <Field key={f.name} label={f.label} error={errors[f.name]?.message}>
                  <input type="number" step="any" {...register(f.name)} className={inputCls} placeholder="0" />
                </Field>
              ))}
            </div>
          </div>

          {/* RO reject routing */}
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <SectionTitle icon={<Recycle className="h-4 w-4" />}>RO Reject Routing (KL)</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="MEE Inlet (KL)" error={errors.meeInlet?.message}>
                <input type="number" step="any" {...register("meeInlet")} className={inputCls} placeholder="0" />
              </Field>
              <div className="hidden sm:block" />

              <Field label="ZLD Outlet (KL)" error={errors.zldOutlet?.message}>
                <input type="number" step="any" {...register("zldOutlet")} className={inputCls} placeholder="0" />
              </Field>
              <Field label="ZLD Outlet — TSS" error={errors.zldOutletTSS?.message}>
                <input type="number" step="any" {...register("zldOutletTSS")} className={inputCls} placeholder="0" />
              </Field>

              <Field label="SEP Inlet (KL)" error={errors.sepInlet?.message}>
                <input type="number" step="any" {...register("sepInlet")} className={inputCls} placeholder="0" />
              </Field>
              <Field label="SEP Inlet — TSS" error={errors.sepInletTSS?.message}>
                <input type="number" step="any" {...register("sepInletTSS")} className={inputCls} placeholder="0" />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              RO Reject is routed to the MEE, or to ZLD &amp; SEP. ZLD Outlet and SEP Inlet each record a TSS sensor reading.
            </p>
          </div>
        </div>

        {/* summary */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-foreground">Today&apos;s Entry</h3>
            <div className="space-y-2.5">
              <Recap label="Inlet" value={inlet} />
              <Recap label="RO Permeate" value={permeate} />
              <Recap label="RO Reject (MEE + ZLD + SEP)" value={rejectTotal} unit="KL" />
            </div>
            <p className="text-xs text-muted-foreground">
              Saved straight to your CETP logbook — there is no verification step.
            </p>
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 rounded-xl text-base font-semibold">
              <Send className="h-4 w-4" />
              {isSubmitting ? "Saving…" : "Submit Entry"}
            </Button>
          </div>

          <AnimatePresence>
            {done && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-5 w-5" />
                  <p className="font-semibold">Entry recorded</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saved to your CETP logbook. Track it on <span className="font-semibold text-foreground">your dashboard</span>.
                </p>
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

function Recap({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-bold text-foreground">
        {formatNumber(value)}
        {unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </span>
    </div>
  );
}
