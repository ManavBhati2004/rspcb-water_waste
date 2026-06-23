"use client";

import { useAuthStore, isAdmin, isEtp } from "@/lib/store/auth";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { CetpsOverview } from "@/components/dashboard/cetps-overview";
import { EtpOverview } from "@/components/dashboard/etp-overview";

export default function DashboardOverview() {
  const role = useAuthStore((s) => s.role);
  if (isAdmin(role)) return <AdminOverview />;
  if (isEtp(role)) return <EtpOverview />;
  return <CetpsOverview />; // cetp role lands on the CETP plants grid
}
