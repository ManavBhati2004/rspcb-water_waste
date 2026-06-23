"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Building2, ShieldCheck, Activity, Lock, Droplets, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JalRakshakLogo } from "@/components/shared/logo";
import { Icon } from "@/components/shared/icon";
import { ROLES } from "@/lib/constants";
import { useAuthStore } from "@/lib/store/auth";
import { useDataStore } from "@/lib/store/data";
import type { RoleId } from "@/lib/types";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: Activity, text: "Live flow & energy monitoring" },
  { icon: ShieldCheck, text: "Automated compliance & alerts" },
  { icon: Droplets, text: "ZLD water-recovery oversight" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const industries = useDataStore((s) => s.industries);
  const [selected, setSelected] = useState<RoleId | null>(null);
  const [company, setCompany] = useState<string>("");
  const [entering, setEntering] = useState(false);

  const needsCompany = selected === "cetp" || selected === "etp";
  const unitOptions = useMemo(() => {
    if (selected === "cetp") return industries.filter((i) => i.cetpId !== null && !i.isIndividualETP);
    if (selected === "etp") return industries.filter((i) => i.isIndividualETP);
    return [];
  }, [selected, industries]);
  const canEnter = !!selected && (!needsCompany || !!company);

  const enter = () => {
    if (!canEnter) return;
    setEntering(true);
    login(selected!, needsCompany ? company : null);
    setTimeout(() => router.push("/dashboard"), 550);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-grid-cyan opacity-25" />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.55), transparent 70%)" }}
        />
        <div className="relative z-10">
          <JalRakshakLogo tone="light" size={40} />
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Water Monitoring
            <br />
            Command Center
          </h1>
          <p className="mt-4 max-w-sm text-white/80">
            Sign in to monitor textile wastewater treatment, compliance and water
            recovery across the Balotra cluster.
          </p>
          <div className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} RSPCB · Balotra — Demonstration prototype
        </div>
      </div>

      {/* Role selection */}
      <div className="relative flex flex-col bg-gradient-to-b from-white via-indigo-50/40 to-violet-50/60 px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 px-3 text-slate-500">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700">
            <Lock className="h-3.5 w-3.5" />
            Demo login · no password
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-8">
          <div className="lg:hidden">
            <JalRakshakLogo size={36} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Choose how you sign in
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Three experiences. The Monitoring Body sees everything; a CETP unit or
            an individual ETP unit sees and feeds only its own data.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {ROLES.map((role, i) => {
              const isSel = selected === role.id;
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  onClick={() => {
                    setSelected(role.id);
                    setCompany("");
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 bg-white p-5 text-left transition-all",
                    isSel ? "border-indigo-500 shadow-lg shadow-indigo-500/10" : "border-slate-200 hover:border-indigo-300 hover:shadow-md",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: role.accent }}
                    >
                      <Icon name={role.icon} className="h-5 w-5" />
                    </span>
                    {isSel && (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-slate-900">{role.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">{role.scope}</p>
                </motion.button>
              );
            })}
          </div>

          {/* unit picker for CETP / ETP */}
          <AnimatePresence initial={false}>
            {needsCompany && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {selected === "etp" ? <Droplets className="h-4 w-4 text-teal-500" /> : <Building2 className="h-4 w-4 text-indigo-500" />}
                    {selected === "etp" ? "Which ETP unit do you operate?" : "Which CETP-connected unit do you operate?"}
                  </label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400"
                  >
                    <option value="" disabled>
                      Select your unit…
                    </option>
                    {unitOptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} — {i.area.split(",")[0]}
                      </option>
                    ))}
                  </select>
                  {selected === "etp" && (
                    <Link
                      href="/register"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline"
                    >
                      <Plus className="h-4 w-4" />
                      Register a new ETP unit
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={enter}
            disabled={!canEnter || entering}
            size="lg"
            className="mt-6 h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-semibold text-white hover:from-indigo-600/90 hover:to-violet-600/90"
          >
            {entering ? "Entering…" : "Enter Command Center"}
            {!entering && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
