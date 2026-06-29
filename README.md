# RSPCB JalRakshak — CETP

### Smart Textile Wastewater Monitoring & Compliance Platform — Common Effluent Treatment Plants

> An initiative by the **Rajasthan State Pollution Control Board (RSPCB) – Balotra**.
> A presentation‑grade, **frontend‑only** prototype that feels like a national environmental command center — monitoring the **CETP Balotra, Jasol and Bithuja** textile clusters.

This is the **CETP** half of JalRakshak (the individual‑ETP platform lives in a separate project/repository). It is a demo — there is **no backend**; all data is mock JSON hydrated into persisted client state.

---

## ✨ Highlights

- **Cinematic GLSL landing** — a custom WebGL shader river (waves, oily chemical swirl, sky reflection, caustics) with GPU particles for smoke, floating textile waste, mist, trees and birds. Click **Reduce Pollution** to play an 8–12s GSAP transformation from a polluted river to a crystal‑clear ecosystem, then the homepage reveals with no reload. Falls back to a static scene when WebGL is unavailable or `prefers-reduced-motion` is set.
- **Light marketing home** — hero with animated counters, CETP overview cards, a live "command center preview", About and Contact.
- **Role‑based demo login** — two roles: **Monitoring Body** (RSPCB authority) and **CETP** (a textile unit connected to a Common Effluent Treatment Plant). No real auth.
- **Dark monitoring dashboard** — command‑center shell with collapsible sidebar, live metrics and route transitions.
  - **CETP module** with an **animated treatment pipeline** (water visibly flows through each stage with live meter values).
  - **Industries** (TanStack table, filters, detail dialog) + **Member Registration** (validated form, success animation).
  - **Flow‑Meter Entry** — 8AM/8PM + late flag, auto‑calculated difference, photo upload, live alert preview. Submissions create approvals + alerts and **persist across refresh**.
  - **Energy** (11 KV / 33 KV animated power flow + charts), **Approvals** (visual workflow timeline, approve/reject), **Alert Center**, **Compliance** (animated gauges), **Reports** (real CSV export), **Settings** (reset demo data).

## 🧱 Tech Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · GSAP · Framer Motion · Three.js + React Three Fiber + drei · Recharts · Zustand (persisted) · TanStack Table · React Hook Form + Zod · Lucide.

## 🚀 Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

## 🎬 Demo flow

1. Open the site → click **Reduce Pollution** and watch the river transform → the homepage reveals.
2. **Enter Platform / Command Center** → pick any role → **Enter Command Center**.
3. Open **CETPs → Balotra** to see the live animated pipeline.
4. Go to **Flow Monitoring → New Entry**, submit a reading → see it appear in **Approvals**, raise **Alerts**, update the dashboard counts, and survive a page refresh.
5. **Reports** → export any report as a real CSV. **Settings → Reset demo data** to restore the seed.

## 🗂 Architecture

```
app/                      routes (landing, login, dashboard/*)
components/
  landing/                cinematic experience + home sections
  three/                  WaterPlane, scene environment, GLSL shaders
  dashboard/              shell, sidebar, topbar, pipeline, data-table, metric-card
  charts/                 Recharts wrappers
  shared/                 logo, icon, animated-counter, status-badge, reveal
lib/
  store/                  zustand stores (auth, ui, data) — persisted to localStorage
  data/seed.ts            deterministic mock-data generator
  types.ts  constants.ts  utils.ts
data/                     cetps.json · industries.json · energy.json
```

All derived data (readings, approvals, alerts, compliance, trends) is generated deterministically from the static JSON so server and client renders stay in sync.

---

_Demonstration prototype — mock data only, no real submissions._
