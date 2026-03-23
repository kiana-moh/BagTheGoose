"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { DashboardSummary } from "@/lib/types";

export const dashboardSummaryQueryKey = ["dashboard-summary"];

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: dashboardSummaryQueryKey,
    queryFn: apiClient.dashboard.getSummary
  });
}
