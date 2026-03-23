"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ApplicationTrackerItem } from "@/lib/types";
import { dashboardSummaryQueryKey } from "./use-dashboard";

export const trackerQueryKey = ["tracker"];

export function useTracker() {
  return useQuery<ApplicationTrackerItem[]>({
    queryKey: trackerQueryKey,
    queryFn: apiClient.tracker.getItems
  });
}

export function useUpdateTrackerItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trackerItemId,
      payload
    }: {
      trackerItemId: string;
      payload: {
        status?: "saved" | "applied" | "interview" | "offer" | "rejected";
        matchScore?: number | null;
        deadline?: string | null;
        notes?: string | null;
      };
    }) => apiClient.tracker.updateItem(trackerItemId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trackerQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardSummaryQueryKey })
      ]);
    }
  });
}
