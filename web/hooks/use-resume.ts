"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ResumeSource } from "@/lib/types";
import { profileQueryKey } from "./use-profile";

export const resumeQueryKey = ["resume"];

export function useResume() {
  return useQuery<ResumeSource | null>({
    queryKey: resumeQueryKey,
    queryFn: apiClient.resume.getResume
  });
}

export function useSubmitResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.resume.saveLatexSource,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resumeQueryKey }),
        queryClient.invalidateQueries({ queryKey: profileQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ]);
    }
  });
}
