"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { OnboardingData } from "@/lib/types";
import { profileQueryKey } from "./use-profile";

export const onboardingQueryKey = ["onboarding"];

export function useOnboarding() {
  return useQuery<OnboardingData>({
    queryKey: onboardingQueryKey,
    queryFn: apiClient.onboarding.getOnboarding
  });
}

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.onboarding.saveProgress,
    onSuccess: async (onboarding) => {
      queryClient.setQueryData(onboardingQueryKey, onboarding);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ]);
    }
  });
}
