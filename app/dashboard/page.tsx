"use client";

import { useAuthStore, isAdmin } from "@/lib/store/auth";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { OperatorOverview } from "@/components/dashboard/operator-overview";

export default function DashboardOverview() {
  const role = useAuthStore((s) => s.role);
  if (isAdmin(role)) return <AdminOverview />;
  return <OperatorOverview />;
}
